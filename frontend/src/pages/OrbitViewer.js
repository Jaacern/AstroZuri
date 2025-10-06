import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import OrbitView from '../components/3D/OrbitView';
import api from '../utils/api';

const OrbitViewer = () => {
  const [asteroids, setAsteroids] = useState([]);
  const [selectedAsteroidId, setSelectedAsteroidId] = useState('all');
  const [hazardFilter, setHazardFilter] = useState('all'); // 'all', 'hazardous', 'nonhazardous'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAsteroids = async (resetFilters = false) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(
        '/api/asteroids?limit=99&sortBy=close_approach_data.0.epoch_date_close_approach&sortOrder=asc'
      );
      setAsteroids(data.asteroids || []);
      if (resetFilters) {
        setHazardFilter('all');
        setSelectedAsteroidId('all');
        window.followAsteroid = false;
      }
    } catch (e) {
      console.error('Failed to load asteroids', e);
      setError(e?.response?.data?.error || 'Failed to load asteroids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAsteroids(true);
  }, []);

  // Filter asteroids based on hazard level and selection
  const filteredAsteroids = asteroids.filter((a) => {
    if (hazardFilter === 'hazardous') return a.is_potentially_hazardous_asteroid;
    if (hazardFilter === 'nonhazardous') return !a.is_potentially_hazardous_asteroid;
    return true;
  });

  const visibleAsteroids =
    selectedAsteroidId === 'all'
      ? filteredAsteroids
      : filteredAsteroids.filter((a) => String(a._id) === String(selectedAsteroidId));

  // 🌌 Interface
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #0b0b13 60%, #000 100%)',
        color: '#fff',
        paddingTop: '80px', // Prevents overlap with fixed navbar
      }}
    >
      <Container fluid className="py-4 px-5">
        <Row>
          {/* 🌟 LEFT CONTROL PANEL */}
          <Col md={4} lg={3} className="mb-4">
            <Card
              className="bg-dark text-light border-secondary shadow-sm"
              style={{ minHeight: '85vh', borderRadius: '10px' }}
            >
              <Card.Header
                className="fw-bold text-uppercase text-warning"
                style={{ borderBottom: '1px solid #333', fontSize: '1.2rem' }}
              >
                Orbit Controls
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  {/* REFRESH BUTTON */}
                  <Button
                    variant="warning"
                    onClick={() => loadAsteroids(true)}
                    disabled={loading}
                    className="w-100 fw-bold mb-3 text-dark"
                    style={{
                      background: 'linear-gradient(90deg, #ff7e29, #ffb347)',
                      border: 'none',
                    }}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        REFRESH
                      </>
                    )}
                  </Button>

                </div>

                {/* 🔍 FILTERS */}
                <div className="mb-4">
                  <h6 className="text-uppercase text-info mb-2">
                    <i className="bi bi-funnel me-2"></i>Filter by Hazard Level
                  </h6>
                  <div className="d-flex flex-wrap gap-2">
                    <Button
                      variant={hazardFilter === 'all' ? 'primary' : 'outline-light'}
                      onClick={() => setHazardFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={hazardFilter === 'hazardous' ? 'danger' : 'outline-danger'}
                      onClick={() => setHazardFilter('hazardous')}
                    >
                      Hazardous
                    </Button>
                    <Button
                      variant={hazardFilter === 'nonhazardous' ? 'success' : 'outline-success'}
                      onClick={() => setHazardFilter('nonhazardous')}
                    >
                      Non-Hazardous
                    </Button>
                  </div>
                </div>

                {/* 🌠 SELECTOR */}
                <div>
                  <h6 className="text-uppercase text-info mb-2">
                    <i className="bi bi-globe-americas me-2"></i>Select Orbit
                  </h6>
                  <select
                    id="asteroid-select"
                    className="form-select bg-black text-light border-secondary"
                    value={selectedAsteroidId}
                    onChange={(e) => setSelectedAsteroidId(e.target.value)}
                  >
                    <option value="all">All Orbits</option>
                    {filteredAsteroids.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name || a.neo_reference_id || a._id}
                      </option>
                    ))}
                  </select>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* 🌌 RIGHT 3D MODEL VIEW */}
          <Col md={8} lg={9}>
            <Card
              className="bg-black border-secondary shadow-lg"
              style={{ borderRadius: '10px', height: '85vh' }}
            >
              <Card.Header
                className="text-uppercase fw-bold text-warning"
                style={{ borderBottom: '1px solid #333', fontSize: '1.2rem' }}
              >
                Earth Orbit Simulation
              </Card.Header>
              <Card.Body className="p-0">
                {error && (
                  <div className="alert alert-warning py-2 mb-3">{error}</div>
                )}
                <OrbitView
                  asteroids={visibleAsteroids}
                  selectedAsteroid={
                    visibleAsteroids.length === 1 ? visibleAsteroids[0] : null
                  }
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OrbitViewer;
