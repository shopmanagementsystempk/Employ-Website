import React, { useState } from 'react';
import { Navbar as BootstrapNavbar, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <BootstrapNavbar className="mb-4 softverse-navbar floating-rings">
        <Container fluid="lg">
          <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <img 
              src="/logo.png" 
              alt="Soft Verse Logo" 
              style={{ 
                height: '40px', 
                width: 'auto', 
                marginRight: '10px',
                objectFit: 'contain'
              }} 
            />
            <span>
              Soft <span style={{ color: '#6ee7b7' }}>Verse</span>
            </span>
          </BootstrapNavbar.Brand>
          <button 
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </Container>
      </BootstrapNavbar>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
    </>
  );
};

export default Navbar;

