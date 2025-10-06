import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import { SafeEnhancedImpact3D, is3DSupported } from '../components/3D';

const Enhanced3DTest = () => {
  const [webGL3DSupported, setWebGL3DSupported] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [testScenario, setTestScenario] = useState('small');
  
  useEffect(() => {
    setWebGL3DSupported(is3DSupported());
  }, []);

  // 🪐 Test Scenarios
  const testScenarios = {
    small: {
      name: "Small Asteroid (Chelyabinsk-like)",
      asteroidData: {
        id: "test-small",
        name: "Test Small Asteroid",
        estimatedDiameter: { kilometers: { estimated_diameter_max: 0.02 } },
        isPotentiallyHazardousAsteroid: false,
        closeApproachData: [{ relativeVelocity: { kilometersPerSecond: "18.5" } }]
      },
      simulationResults: {
        energy: 5.4e14,
        tntEquivalent: 440000,
        craterDiameter: 0.15,
        craterDepth: 0.03,
        severity: 'moderate',
        affectedArea: 1500,
        estimatedCasualties: 1500,
        economicImpact: 33000000
      },
      impactLocation: { lat: 55.1544, lng: 61.4292 },
      impactAngle: 18,
      impactVelocity: 18.5
    },
    medium: {
      name: "Medium Asteroid (Tunguska-like)",
      asteroidData: {
        id: "test-medium",
        name: "Test Medium Asteroid",
        estimatedDiameter: { kilometers: { estimated_diameter_max: 0.06 } },
        isPotentiallyHazardousAsteroid: true,
        closeApproachData: [{ relativeVelocity: { kilometersPerSecond: "27.0" } }]
      },
      simulationResults: {
        energy: 1.5e16,
        tntEquivalent: 12000000,
        craterDiameter: 1.2,
        craterDepth: 0.2,
        severity: 'severe',
        affectedArea: 2150,
        estimatedCasualties: 0,
        economicImpact: 0
      },
      impactLocation: { lat: 60.8858, lng: 101.8917 },
      impactAngle: 30,
      impactVelocity: 27.0
    },
    large: {
      name: "Large Asteroid (Chicxulub-like)",
      asteroidData: {
        id: "test-large",
        name: "Test Large Asteroid",
        estimatedDiameter: { kilometers: { estimated_diameter_max: 10 } },
        isPotentiallyHazardousAsteroid: true,
        closeApproachData: [{ relativeVelocity: { kilometersPerSecond: "30.0" } }]
      },
      simulationResults: {
        energy: 4.2e23,
        tntEquivalent: 100000000000000,
        craterDiameter: 150,
        craterDepth: 20,
        severity: 'catastrophic',
        affectedArea: 70000000,
        estimatedCasualties: 6000000000,
        economicImpact: 100000000000000
      },
      impactLocation: { lat: 21.4, lng: -89.5 },
      impactAngle: 60,
      impactVelocity: 30.0
    }
  };

  const currentScenario = testScenarios[testScenario];

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'catastrophic': return 'danger';
      case 'severe': return 'warning';
      case 'moderate': return 'info';
      default: return 'success';
    }
  };

  if (!webGL3DSupported) {
    return (
      <Container className="py-5" style={{ marginTop: '100px' }}>
        <Alert variant="danger">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>
            WebGL Not Supported
          </Alert.Heading>
          <p>
            Your browser doesn't support WebGL, which is required for the Enhanced 3D visualization.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <div style={{
      background: 'radial-gradient(circle at top, #0b0b15 0%, #000 100%)',
      color: '#fff',
      minHeight: '100vh',
      paddingTop: '80px'
    }}>
      <Container fluid="lg">
        <Row className="mb-4">
          <Col>
            <h1 className="display-5 fw-bold text-glow">
              <i className="bi bi-cpu-fill me-2 text-warning"></i>
              Enhanced 3D Animation Test
            </h1>
            <p className="text-muted">
              Test the new enhanced 3D asteroid impact animation system with realistic scenarios.
            </p>
          </Col>
        </Row>

        <Row>
          {/* Left Panel */}
          <Col lg={4}>
            <Card className="glass-card mb-4 p-2">
              <Card.Header className="border-secondary text-uppercase fw-bold text-warning">
                <i className="bi bi-sliders me-2"></i> Test Controls
              </Card.Header>
              <Card.Body>
                {/* Scenario Selector */}
                <Form.Group className="mb-3">
                  <Form.Label>Test Scenario</Form.Label>
                  <Form.Select
                    className="bg-dark text-light border-secondary"
                    value={testScenario}
                    onChange={(e) => {
                      setTestScenario(e.target.value);
                      setAnimate(false);
                    }}
                  >
                    <option value="small">Small Asteroid (Chelyabinsk-like)</option>
                    <option value="medium">Medium Asteroid (Tunguska-like)</option>
                    <option value="large">Large Asteroid (Chicxulub-like)</option>
                  </Form.Select>
                </Form.Group>

                {/* Info */}
                <Card className="bg-black border-secondary mb-3">
                  <Card.Body>
                    <h6 className="text-info mb-2">{currentScenario.asteroidData.name}</h6>
                    <div className="small text-white">
                      <div><b>Diameter:</b> {currentScenario.asteroidData.estimatedDiameter.kilometers.estimated_diameter_max} km</div>
                      <div><b>Velocity:</b> {currentScenario.asteroidData.closeApproachData[0].relativeVelocity.kilometersPerSecond} km/s</div>
                      <div><b>Impact Angle:</b> {currentScenario.impactAngle}°</div>
                      <div>
                        <b>Severity:</b>{' '}
                        <Badge bg={getSeverityColor(currentScenario.simulationResults.severity)}>
                          {currentScenario.simulationResults.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {/* Animation Button */}
                <div className="d-grid gap-2 mb-4">
                  <Button
                    variant={animate ? 'danger' : 'success'}
                    size="lg"
                    className="fw-bold btn-glow"
                    onClick={() => setAnimate(!animate)}
                  >
                    <i className={`bi bi-${animate ? 'stop-circle' : 'play-circle'} me-2`}></i>
                    {animate ? 'Stop Animation' : 'Start Animation'}
                  </Button>
                </div>

                {/* Enhanced Features */}
                <div className="small text-muted">
                  <h6 className="text-warning mb-2"><i className="bi bi-stars me-2"></i>Enhanced Features</h6>
                  <ul className="mb-0">
                    <li>Physics-based trajectory simulation</li>
                    <li>Advanced particle systems (explosion & debris)</li>
                    <li>Realistic material shaders</li>
                    <li>Performance optimization (LOD, pooling)</li>
                    <li>Interactive camera controls</li>
                    <li>Real-time timeline</li>
                  </ul>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right 3D Visualization */}
          <Col lg={8}>
            <Card className="glass-card border-secondary shadow-lg">
              <Card.Header className="fw-bold text-warning text-uppercase border-secondary">
                <i className="bi bi-globe2 me-2"></i> Enhanced 3D Impact Simulation
              </Card.Header>
              <Card.Body className="p-0 position-relative">
                <div style={{ height: '600px', width: '100%', background: '#000' }}>
                  <SafeEnhancedImpact3D
                    simulationData={{
                      impactData: currentScenario.simulationResults,
                      asteroidData: currentScenario.asteroidData,
                      impactLocation: currentScenario.impactLocation,
                      impactAngle: currentScenario.impactAngle,
                      impactVelocity: currentScenario.impactVelocity,
                      animate: animate
                    }}
                    onAnimationComplete={() => setAnimate(false)}
                  />
                  <div className="position-absolute bottom-0 start-0 p-2 small text-muted" style={{ background: 'rgba(0,0,0,0.6)', borderRadius: '4px' }}>
                    Drag to rotate • Scroll to zoom • Click UI controls for settings
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Result Summary */}
            <Card className="glass-card mt-4 border-secondary">
              <Card.Header className="text-uppercase fw-bold text-info border-secondary">
                <i className="bi bi-bar-chart me-2"></i> Impact Results Preview
              </Card.Header>
              <Card.Body>
                <Row className="text-center">
                  <Col md={3}>
                    <h6 className="text-primary">Energy</h6>
                    <div className="fw-bold text-glow-blue">{formatNumber(currentScenario.simulationResults.energy)} J</div>
                  </Col>
                  <Col md={3}>
                    <h6 className="text-warning">Crater</h6>
                    <div className="fw-bold text-glow-orange">{currentScenario.simulationResults.craterDiameter} km</div>
                  </Col>
                  <Col md={3}>
                    <h6 className="text-danger">Affected Area</h6>
                    <div className="fw-bold text-glow-red">{formatNumber(currentScenario.simulationResults.affectedArea)} km²</div>
                  </Col>
                  <Col md={3}>
                    <h6 className="text-success">TNT Equivalent</h6>
                    <div className="fw-bold text-glow-green">{formatNumber(currentScenario.simulationResults.tntEquivalent)} tons</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Enhanced3DTest;
