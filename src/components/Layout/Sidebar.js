import React from 'react';
import { Nav, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    onClose();
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when link is clicked
    if (window.innerWidth < 992) {
      onClose();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img 
              src="/logo.png" 
              alt="Soft Verse Logo" 
              className="sidebar-logo"
            />
            <span className="sidebar-brand-text">
              Soft <span style={{ color: '#6ee7b7' }}>Verse</span>
            </span>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>
        
        <div className="sidebar-content">
          <Nav className="flex-column sidebar-nav">
            {currentUser && (
              <>
                {userRole === 'admin' && (
                  <>
                    <Nav.Link 
                      as={Link} 
                      to="/admin/dashboard" 
                      onClick={handleLinkClick}
                      className={isActive('/admin/dashboard') ? 'active' : ''}
                    >
                      Admin Dashboard
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/admin/users" 
                      onClick={handleLinkClick}
                      className={isActive('/admin/users') ? 'active' : ''}
                    >
                      Manage Users
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/admin/employees" 
                      onClick={handleLinkClick}
                      className={isActive('/admin/employees') ? 'active' : ''}
                    >
                      Manage Employees
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/admin/offer-letters" 
                      onClick={handleLinkClick}
                      className={isActive('/admin/offer-letters') ? 'active' : ''}
                    >
                      Offer Letters
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/admin/appointment-letters" 
                      onClick={handleLinkClick}
                      className={isActive('/admin/appointment-letters') ? 'active' : ''}
                    >
                      Appointment Letters
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/admin/visiting-card-records" 
                      onClick={handleLinkClick}
                      className={isActive('/admin/visiting-card-records') ? 'active' : ''}
                    >
                      Card History
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/admin/offer-letter-records" 
                      onClick={handleLinkClick}
                      className={isActive('/admin/offer-letter-records') ? 'active' : ''}
                    >
                      Offer Letter Records
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/admin/appointment-letter-records" 
                      onClick={handleLinkClick}
                      className={isActive('/admin/appointment-letter-records') ? 'active' : ''}
                    >
                      Appointment Letter Records
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/admin/templates" 
                      onClick={handleLinkClick}
                      className={isActive('/admin/templates') ? 'active' : ''}
                    >
                      Card Templates
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/admin/logs" 
                      onClick={handleLinkClick}
                      className={isActive('/admin/logs') ? 'active' : ''}
                    >
                      Activity Logs
                    </Nav.Link>
                  </>
                )}
                {(userRole === 'employee' || userRole === 'admin') && (
                  <>
                    <Nav.Link 
                      as={Link} 
                      to="/employee/dashboard" 
                      onClick={handleLinkClick}
                      className={isActive('/employee/dashboard') ? 'active' : ''}
                    >
                      Employee Dashboard
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/employee/visiting-card" 
                      onClick={handleLinkClick}
                      className={isActive('/employee/visiting-card') ? 'active' : ''}
                    >
                      My Visiting Card
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/employee/visitor-card" 
                      onClick={handleLinkClick}
                      className={isActive('/employee/visitor-card') ? 'active' : ''}
                    >
                      Generate Visitor Card
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/employee/visitor-history" 
                      onClick={handleLinkClick}
                      className={isActive('/employee/visitor-history') ? 'active' : ''}
                    >
                      Visitor History
                    </Nav.Link>
                  </>
                )}
              </>
            )}
          </Nav>
          
          <div className="sidebar-footer">
            {currentUser ? (
              <div className="sidebar-user">
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <div className="sidebar-user-email">
                    {currentUser.email}
                  </div>
                </div>
                <button 
                  className="sidebar-logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="sidebar-auth">
                <Nav.Link as={Link} to="/login" onClick={handleLinkClick}>
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" onClick={handleLinkClick}>
                  Register
                </Nav.Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

