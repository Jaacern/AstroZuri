import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Modal } from 'react-bootstrap';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Componente de Tierra para VR
const VREarthSphere = () => {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const [earthColorMap, earthNormalMap, earthClouds] = useTexture([
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_clouds_1024.png'
  ]);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.005;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.006;
    }
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial map={earthColorMap} normalMap={earthNormalMap} roughness={0.9} metalness={0.0} />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.015, 48, 48]} />
        <meshPhongMaterial map={earthClouds} transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  );
};

// Asteroides orbitando para VR
const VRAsteroid = ({ asteroid, index }) => {
  const ref = useRef();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const avgDiameter = asteroid?.calculatedProperties?.averageDiameter ||
    asteroid?.estimated_diameter?.meters?.estimated_diameter_max || 200;
  
  const velocityKps = Number(
    asteroid?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second
  ) || asteroid?.calculatedProperties?.averageVelocity || 10;

  const missKm = Number(asteroid?.close_approach_data?.[0]?.miss_distance?.kilometers) || 3.8e5;
  const aSemi = Math.max(1.2, Math.min(12, missKm / 12000));
  const bSemi = Math.max(0.6, Math.min(aSemi, aSemi * (0.55 + 0.35 * (0.3 + (index % 7) / 10))));
  const size = Math.max(0.03, Math.min(0.15, (avgDiameter / 1000) * 0.05));

  const epochMs = Number(asteroid?.close_approach_data?.[0]?.epoch_date_close_approach) || 0;
  const phase = (epochMs / 1e7) % (Math.PI * 2) + (index % 16) * (Math.PI / 8);

  const angularSpeed = (velocityKps / 50) * 0.7 / Math.max(0.8, (aSemi + bSemi) / 2);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const theta = phase + t * angularSpeed;
    const x = Math.cos(theta) * aSemi;
    const z = Math.sin(theta) * bSemi;
    const y = 0;
    if (ref.current) ref.current.position.set(x, y, z);
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={ref}
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      >
        <dodecahedronGeometry args={[size, 0]} />
        <meshStandardMaterial 
          color={hovered ? '#e0b089' : '#b38b6d'} 
          roughness={0.9} 
          metalness={0.05} 
        />
        {hovered && (
          <Html position={[0, 0.25 + size * 2, 0]} center distanceFactor={6}>
            <div style={{
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              border: '1px solid #444',
              maxWidth: '260px'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {asteroid?.name || asteroid?.neo_reference_id || 'Asteroid'}
              </div>
              <div style={{ opacity: 0.9 }}>
                <div><b>Diameter:</b> {avgDiameter?.toFixed(0)} m</div>
                <div><b>Velocity:</b> {velocityKps?.toFixed(2)} km/s</div>
                <div><b>Hazard:</b> {asteroid?.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
};

// Fondo de estrellas para VR
const VRStarsBackground = () => {
  return (
    <mesh>
      <sphereGeometry args={[60, 32, 32]} />
      <meshBasicMaterial color="#000010" side={1} />
    </mesh>
  );
};

// Escena VR principal
const VRScene = ({ asteroids, vrMode }) => {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 8, 5]} intensity={1} castShadow />
      <pointLight position={[-6, -4, -4]} intensity={0.3} color="#ff6b35" />

      <VRStarsBackground />
      <group>
        <VREarthSphere />
        {asteroids?.map((a, i) => (
          <VRAsteroid key={a._id || i} asteroid={a} index={i} />
        ))}
      </group>

      <OrbitControls 
        enablePan={!vrMode} 
        enableZoom={!vrMode} 
        enableRotate={!vrMode} 
        autoRotate={vrMode}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

const VR = () => {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vrMode, setVrMode] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [deviceType, setDeviceType] = useState('desktop');
  const [showInstructions, setShowInstructions] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Detectar tipo de dispositivo
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');
  }, []);

  const loadAsteroids = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/asteroids?limit=50&sortBy=close_approach_data.0.epoch_date_close_approach&sortOrder=asc');
      const data = await response.json();
      setAsteroids(data.asteroids || []);
    } catch (e) {
      console.error('Failed to load asteroids', e);
      setError('Error al cargar asteroides');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: deviceType === 'mobile' ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const toggleVRMode = () => {
    setVrMode(!vrMode);
    if (!vrMode) {
      startCamera();
    } else {
      stopCamera();
    }
  };

  useEffect(() => {
    loadAsteroids();
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="py-4">
      <Container>
        <Row className="mb-3 align-items-center">
          <Col>
            <h2 className="mb-0">
              <i className="bi bi-vr me-2"></i>
              Realidad Virtual - Órbitas
            </h2>
            <small className="text-muted">
              Visualización inmersiva de asteroides orbitando la Tierra
            </small>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2">
              <Button 
                variant={vrMode ? "danger" : "success"} 
                onClick={toggleVRMode}
                disabled={loading}
              >
                <i className={`bi ${vrMode ? 'bi-stop-circle' : 'bi-play-circle'} me-1`}></i>
                {vrMode ? 'Salir VR' : 'Activar VR'}
              </Button>
              <Button variant="outline-primary" onClick={() => setShowInstructions(true)}>
                <i className="bi bi-question-circle me-1"></i>
                Ayuda
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="warning" className="mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        <Row>
          <Col lg={8}>
            <Card className="mb-3">
              <Card.Body className="p-0">
                <div style={{ 
                  width: '100%', 
                  height: '600px', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  background: '#000',
                  position: 'relative'
                }}>
                  <Canvas shadows camera={{ position: [0, 3, 10], fov: 50 }}>
                    <VRScene asteroids={asteroids} vrMode={vrMode} />
                  </Canvas>
                  
                  {vrMode && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}>
                      <i className="bi bi-camera-video me-1"></i>
                      Modo VR Activo
                      <Badge bg="success" className="ms-2">ON</Badge>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="mb-3">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-gear me-2"></i>
                  Controles VR
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <h6>Dispositivo Detectado:</h6>
                  <Badge bg={deviceType === 'mobile' ? 'primary' : 'secondary'}>
                    <i className={`bi ${deviceType === 'mobile' ? 'bi-phone' : 'bi-laptop'} me-1`}></i>
                    {deviceType === 'mobile' ? 'Móvil' : 'Escritorio'}
                  </Badge>
                </div>

                <div className="mb-3">
                  <h6>Cámara:</h6>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={startCamera}
                      disabled={!!cameraStream}
                    >
                      <i className="bi bi-camera me-1"></i>
                      Iniciar
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={stopCamera}
                      disabled={!cameraStream}
                    >
                      <i className="bi bi-stop me-1"></i>
                      Detener
                    </Button>
                  </div>
                </div>

                <div className="mb-3">
                  <h6>Estadísticas:</h6>
                  <small className="text-muted">
                    <div>Asteroides cargados: <strong>{asteroids.length}</strong></div>
                    <div>Modo VR: <strong>{vrMode ? 'Activo' : 'Inactivo'}</strong></div>
                    <div>Cámara: <strong>{cameraStream ? 'Conectada' : 'Desconectada'}</strong></div>
                  </small>
                </div>

                <Button 
                  variant="primary" 
                  onClick={loadAsteroids} 
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Cargando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Actualizar Asteroides
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Información VR
                </h5>
              </Card.Header>
              <Card.Body>
                <p className="small text-muted">
                  <strong>Modo VR:</strong> Activa la rotación automática y desactiva controles manuales.
                </p>
                <p className="small text-muted">
                  <strong>Cámara:</strong> Usa la cámara trasera en móviles y webcam en escritorio.
                </p>
                <p className="small text-muted">
                  <strong>Interacción:</strong> Pasa el mouse sobre los asteroides para ver detalles.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal de instrucciones */}
        <Modal show={showInstructions} onHide={() => setShowInstructions(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-vr me-2"></i>
              Instrucciones de Realidad Virtual
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <h5><i className="bi bi-phone me-2"></i>Para Móviles:</h5>
                <ul>
                  <li>Permite el acceso a la cámara cuando se solicite</li>
                  <li>Usa la cámara trasera para mejor experiencia</li>
                  <li>Mueve el dispositivo para explorar diferentes ángulos</li>
                  <li>El modo VR activa la rotación automática</li>
                </ul>
              </Col>
              <Col md={6}>
                <h5><i className="bi bi-laptop me-2"></i>Para Escritorio:</h5>
                <ul>
                  <li>Permite el acceso a la webcam</li>
                  <li>Usa los controles del mouse para navegar</li>
                  <li>Activa VR para experiencia inmersiva</li>
                  <li>Combina con realidad aumentada usando la webcam</li>
                </ul>
              </Col>
            </Row>
            <Alert variant="info" className="mt-3">
              <i className="bi bi-lightbulb me-2"></i>
              <strong>Tip:</strong> Para una experiencia completa, coloca el dispositivo en un soporte 
              y permite que la escena rote automáticamente en modo VR.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowInstructions(false)}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default VR;

