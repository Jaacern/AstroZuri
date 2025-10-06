import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useTexture, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';

/* 🌍 Earth sphere with atmosphere */
const EarthSphere = () => {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const [earthColorMap, earthNormalMap, earthClouds] = useTexture([
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_clouds_1024.png'
  ]);

  useFrame(() => {
    if (earthRef.current) earthRef.current.rotation.y += 0.0005;
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0007;
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={earthColorMap}
          normalMap={earthNormalMap}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.015, 64, 64]} />
        <meshPhongMaterial map={earthClouds} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.03, 64, 64]} />
        <meshBasicMaterial color="#007bff" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

/* 🌀 Elliptical orbit */
const OrbitRing = ({ a, b, color }) => {
  const points = useMemo(() => {
    const seg = 200;
    const pts = [];
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * a, 0, Math.sin(t) * b));
    }
    return pts;
  }, [a, b]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.2}
      transparent
      opacity={0.6}
    />
  );
};

/* ☄️ Orbiting asteroid */
const OrbitingAsteroid = ({ asteroid, index, isSelected }) => {
  const meshRef = useRef();
  const groupRef = useRef();

  const avgDiameter =
    asteroid?.calculatedProperties?.averageDiameter ||
    asteroid?.estimated_diameter?.meters?.estimated_diameter_max ||
    200;

  const velocityKps =
    Number(asteroid?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second) ||
    asteroid?.calculatedProperties?.averageVelocity ||
    10;

  const missKm = Number(asteroid?.close_approach_data?.[0]?.miss_distance?.kilometers) || 3.8e5;

  const aSemi = useMemo(() => Math.max(1.5, Math.min(15, missKm / 12000)), [missKm]);
  const bSemi = useMemo(() => {
    const vNorm = Math.max(1, Math.min(50, velocityKps)) / 50;
    const factor = 0.55 + 0.35 * (0.3 + (index % 7) / 10) * (1 - vNorm);
    return Math.max(0.6, Math.min(aSemi, aSemi * factor));
  }, [aSemi, velocityKps, index]);

  const size = Math.max(0.02, Math.min(0.12, (avgDiameter / 1000) * 0.05));

  const epochMs = Number(asteroid?.close_approach_data?.[0]?.epoch_date_close_approach) || 0;
  const phase = useMemo(() => {
    const base = (epochMs / 1e7) % (Math.PI * 2);
    return base + (index % 16) * (Math.PI / 8);
  }, [epochMs, index]);

  const idSeed = (asteroid?.neo_reference_id || String(asteroid?._id || index))
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const inclination = ((idSeed % 45) - 22.5) * (Math.PI / 180);
  const omega = ((idSeed % 360) * Math.PI) / 180;
  const argPeriapsis = (((idSeed * 3) % 360) * Math.PI) / 180;

  const angularSpeed = useMemo(() => {
    const v = Math.max(1, Math.min(50, velocityKps));
    return (v / 50) * 0.7 / Math.max(0.8, (aSemi + bSemi) / 2);
  }, [velocityKps, aSemi, bSemi]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const theta = phase + t * angularSpeed;
    const x = Math.cos(theta) * aSemi;
    const z = Math.sin(theta) * bSemi;
    if (meshRef.current) meshRef.current.position.set(x, 0, z);
  });

  const color = asteroid?.is_potentially_hazardous_asteroid ? '#ff5b5b' : '#cfcfcf';

  return (
    <group ref={groupRef} rotation={[inclination, omega, argPeriapsis]}>
      <OrbitRing a={aSemi} b={bSemi} color={color} />

      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          color={isSelected ? '#ffcc66' : '#b38b6d'}
          emissive={isSelected ? '#ffcc33' : '#000'}
          emissiveIntensity={isSelected ? 0.6 : 0.1}
        />

        {/* Triangle indicator */}
        <mesh position={[0, size * 3, 0]}>
          <coneGeometry args={[size * 0.8, size * 1.8, 3]} />
          <meshStandardMaterial
            color={asteroid?.is_potentially_hazardous_asteroid ? '#ff5555' : '#66ccff'}
            emissive={asteroid?.is_potentially_hazardous_asteroid ? '#ff3333' : '#0a7bff'}
            emissiveIntensity={0.9}
          />
        </mesh>
      </mesh>
    </group>
  );
};

/* 🌌 Scene */
const Scene = ({ asteroids = [], selectedAsteroid }) => (
  <>
    <ambientLight intensity={0.35} />
    <directionalLight position={[6, 8, 5]} intensity={1.2} />
    <pointLight position={[-6, -4, -4]} intensity={0.4} color="#3399ff" />
    <Stars radius={100} depth={50} count={6000} factor={4} fade />
    <EarthSphere />
    {asteroids.map((a, i) => (
      <OrbitingAsteroid
        key={a._id || i}
        asteroid={a}
        index={i}
        isSelected={selectedAsteroid && a._id === selectedAsteroid._id}
      />
    ))}
    <OrbitControls enablePan enableZoom enableRotate />
  </>
);

/* 🛰 HUD information for selected asteroid */
const AsteroidInfoHUD = ({ asteroid }) => {
  if (!asteroid) return null;

  const velocity = asteroid?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second;
  const missDistance = asteroid?.close_approach_data?.[0]?.miss_distance?.kilometers;
  const diameter =
    asteroid?.calculatedProperties?.averageDiameter ||
    asteroid?.estimated_diameter?.meters?.estimated_diameter_max;
  const isHazardous = asteroid?.is_potentially_hazardous_asteroid;

  const reason = isHazardous
    ? `This asteroid is classified as potentially hazardous because its orbit crosses near Earth's path (less than 7.5 million km) and its size or velocity could cause significant impact effects if it entered the atmosphere.`
    : `This asteroid is considered non-hazardous because its orbit remains safely distant from Earth or its size is too small to cause major damage.`;

  return (
    <div style={{
      position: 'absolute',
      right: 20,
      bottom: 20,
      background: 'rgba(0,0,0,0.8)',
      border: '1px solid #444',
      borderRadius: 10,
      padding: '12px 16px',
      color: '#fff',
      width: 320,
      fontSize: '0.9rem',
      lineHeight: 1.4,
      zIndex: 5
    }}>
      <h6 style={{ color: isHazardous ? '#ff6666' : '#66ff99', marginBottom: 6 }}>
        {asteroid.name || 'Unnamed Asteroid'}
      </h6>
      <div><b>Velocity:</b> {velocity ? `${parseFloat(velocity).toFixed(2)} km/s` : 'N/A'}</div>
      <div><b>Closest Approach:</b> {missDistance ? `${(missDistance / 1000).toFixed(2)} million km` : 'N/A'}</div>
      <div><b>Diameter:</b> {diameter ? `${(diameter / 1000).toFixed(3)} km` : 'N/A'}</div>
      <div style={{ marginTop: 8, fontStyle: 'italic', opacity: 0.9 }}>{reason}</div>
    </div>
  );
};

/* 🪐 Main container */
const OrbitView = ({ asteroids = [], selectedAsteroid }) => (
  <div
    style={{
      position: 'relative',
      width: '100%',
      height: '600px',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#000'
    }}
  >
    <Canvas shadows camera={{ position: [0, 3, 10], fov: 55 }}>
      <Scene asteroids={asteroids} selectedAsteroid={selectedAsteroid} />
    </Canvas>

    {selectedAsteroid && (
      <AsteroidInfoHUD asteroid={selectedAsteroid} />
    )}
  </div>
);

export default OrbitView;
