import React from 'react';
import { Navbar, Nav, Container, Dropdown, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';
import astrozuriLogo from '../assets/astrozuri.png';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <Navbar expand="lg" variant="dark" fixed="top" className="navbar-custom">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand className="d-flex align-items-center">
            <img 
              src={astrozuriLogo} 
              alt="AstroZuri Logo" 
              className="navbar-logo me-2"
              style={{ 
                width: '32px', 
                height: '32px',
                objectFit: 'contain',
                backgroundColor: 'transparent',
                border: 'none'
              }}
              onLoad={() => console.log('Navbar logo loaded')}
              onError={(e) => {
                console.log('Navbar logo failed to load, showing fallback');
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'inline-block';
              }}
            />
            <i className="bi bi-rocket-takeoff me-2" style={{ display: 'none' }}></i>
            AstroZuri
          </Navbar.Brand>
        </LinkContainer>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/asteroids">
              <Nav.Link>
                <i className="bi bi-search me-1"></i>
                Explore Asteroids
              </Nav.Link>
            </LinkContainer>
            
            {/* Temporarily disabled simulator link */}
            {/*
            {isAuthenticated && (
              <LinkContainer to="/simulator">
                <Nav.Link>
                  <i className="bi bi-geo-alt me-1"></i>
                  Simulator
                </Nav.Link>
              </LinkContainer>
            )}
            */}
            
            <LinkContainer to="/community">
              <Nav.Link>
                <i className="bi bi-people me-1"></i>
                Community
              </Nav.Link>
            </LinkContainer>
            
              {/* Leaderboard eliminado */}
            
            <LinkContainer to="/orbits">
              <Nav.Link>
                <i className="bi bi-globe me-1"></i>
                Orbits
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/3d-test">
              <Nav.Link>
                <i className="bi bi-cpu me-1"></i>
                3D Test
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/vr">
              <Nav.Link>
                <i className="bi bi-vr me-1"></i>
                VR Experience
              </Nav.Link>
            </LinkContainer>
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <>
                <LinkContainer to="/dashboard">
                  <Nav.Link>
                    <i className="bi bi-speedometer2 me-1"></i>
                    Dashboard
                  </Nav.Link>
                </LinkContainer>
                
                <Dropdown align="end">
                  <Dropdown.Toggle as={Nav.Link} className="d-flex align-items-center">
                    <i className="bi bi-person-circle me-2"></i>
                    {user?.username}
                    {user?.stats?.points > 0 && (
                      <Badge bg="primary" className="ms-2">
                        {user.stats.points}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  
                  <Dropdown.Menu className="dropdown-menu-dark">
                    <LinkContainer to="/profile">
                      <Dropdown.Item>
                        <i className="bi bi-person me-2"></i>
                        Profile
                      </Dropdown.Item>
                    </LinkContainer>
                    
                    <Dropdown.Divider />
                    
                    <Dropdown.Item onClick={logout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <LinkContainer to="/login">
                  <Nav.Link>
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Login
                  </Nav.Link>
                </LinkContainer>
                
                <LinkContainer to="/register">
                  <Nav.Link>
                    <i className="bi bi-person-plus me-1"></i>
                    Register
                  </Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
