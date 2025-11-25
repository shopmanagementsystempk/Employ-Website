import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar expand="lg" className="mb-4 softverse-navbar floating-rings">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          Soft <span style={{ color: '#6ee7b7' }}>Verse</span>
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto gap-2">
            {currentUser && (
              <>
                {userRole === 'admin' && (
                  <>
                    <Nav.Link as={Link} to="/admin/dashboard">Admin Dashboard</Nav.Link>
                    <Nav.Link as={Link} to="/admin/users">Manage Users</Nav.Link>
                    <Nav.Link as={Link} to="/admin/employees">Manage Employees</Nav.Link>
                    <Nav.Link as={Link} to="/admin/offer-letters">Offer Letters</Nav.Link>
                    <Nav.Link as={Link} to="/admin/visiting-card-records">Card History</Nav.Link>
                    <Nav.Link as={Link} to="/admin/offer-letter-records">Offer Letter Records</Nav.Link>
                    <Nav.Link as={Link} to="/admin/templates">Card Templates</Nav.Link>
                    <Nav.Link as={Link} to="/admin/logs">Activity Logs</Nav.Link>
                  </>
                )}
                {(userRole === 'employee' || userRole === 'admin') && (
                  <>
                    <Nav.Link as={Link} to="/employee/dashboard">Employee Dashboard</Nav.Link>
                    <Nav.Link as={Link} to="/employee/visiting-card">My Visiting Card</Nav.Link>
                    <Nav.Link as={Link} to="/employee/visitor-card">Generate Visitor Card</Nav.Link>
                    <Nav.Link as={Link} to="/employee/visitor-history">Visitor History</Nav.Link>
                  </>
                )}
              </>
            )}
          </Nav>
          <Nav className="align-items-center gap-2">
            {currentUser ? (
              <NavDropdown title={currentUser.displayName || currentUser.email} id="user-dropdown" align="end">
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;

