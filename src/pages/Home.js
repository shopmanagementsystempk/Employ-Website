import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser, userRole } = useAuth();
  const isEmployee = userRole === 'employee' || userRole === 'admin';

  const employeeActions = [
    {
      title: 'Employee Dashboard',
      description: 'Track personal stats, visitors, and card activity in one glance.',
      to: '/employee/dashboard'
    },
    {
      title: 'My Visiting Card',
      description: 'Create beautiful digital and printable cards with a single click.',
      to: '/employee/visiting-card'
    },
    {
      title: 'Generate Visitor Pass',
      description: 'Register guests, print visitor cards, and keep history organized.',
      to: '/employee/visitor-card'
    },
    {
      title: 'Visitor History',
      description: 'Review who checked in, when, and why for better compliance.',
      to: '/employee/visitor-history'
    }
  ];

  const adminActions = [
    {
      title: 'Manage Users',
      description: 'Approve, assign roles, and keep your organization secure.',
      to: '/admin/users'
    },
    {
      title: 'Manage Employees',
      description: 'Update profiles, departments, and assign card templates.',
      to: '/admin/employees'
    },
    {
      title: 'Card Templates',
      description: 'Design, preview, and publish new branded card layouts.',
      to: '/admin/templates'
    },
    {
      title: 'Activity Logs',
      description: 'Monitor sign-ins, card generation, and visitor entries.',
      to: '/admin/logs'
    }
  ];

  return (
    <div className="py-5">
      <Container>
        {!currentUser ? (
          <div className="hero-section text-center position-relative overflow-hidden">
            <div className="stat-pill mx-auto mb-3">
              <span role="img" aria-label="spark">✨</span>
              Smart Workplace Access
            </div>
            <h1 className="hero-title mb-3">Welcome to Soft Verse</h1>
            <p className="hero-text mb-4">
              A modern digital identity platform for your workforce and guests. Generate professional visiting cards,
              manage visitor entries, and monitor every activity in real time.
            </p>
            <div className="hero-actions d-flex flex-column flex-md-row justify-content-center gap-3">
              <Link to="/login" className="btn btn-primary px-5">Login</Link>
              <Link to="/register" className="btn btn-outline-primary px-5">Create Account</Link>
            </div>
            <Row className="mt-4 text-start text-muted">
              <Col md={4}><strong>5K+</strong><br />Digital cards generated</Col>
              <Col md={4}><strong>12K+</strong><br />Visitor check-ins</Col>
              <Col md={4}><strong>25+</strong><br />Card templates</Col>
            </Row>
          </div>
        ) : (
          <>
            <div className="hero-section mb-4">
              <Row className="align-items-center">
                <Col lg={7}>
                  <div className="stat-pill mb-3">
                    <span role="img" aria-label="wave">👋</span>
                    {userRole === 'admin' ? 'Admin Control Center' : 'Employee Workspace'}
                  </div>
                  <h1 className="hero-title mb-3">Welcome back, {currentUser.displayName || currentUser.email}</h1>
                  <p className="hero-text mb-4">
                    {userRole === 'admin'
                      ? 'Oversee your entire organization, empower employees, and keep visitor flows secure.'
                      : 'Your digital business tools and visitor passes are ready whenever you are.'}
                  </p>
                  <div className="d-flex gap-3 flex-wrap">
                    <Link
                      to={userRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard'}
                      className="btn btn-primary"
                    >
                      Go to Dashboard
                    </Link>
                    {userRole === 'admin' && (
                      <Link to="/admin/logs" className="btn btn-outline-primary">
                        View Activity
                      </Link>
                    )}
                  </div>
                </Col>
                <Col lg={5} className="mt-4 mt-lg-0">
                  <div className="insights-card">
                    <div className="d-flex justify-content-between mb-2">
                      <h3>Live Insights</h3>
                      <span className="insight-badge">Realtime</span>
                    </div>
                    <p className="mb-4 text-light">
                      Visitor influx steady and card generation trending upward this week. Keep up the great work!
                    </p>
                    <Row className="text-center">
                      <Col>
                        <h4 className="mb-1">+18%</h4>
                        <small className="text-muted">Visitor Growth</small>
                      </Col>
                      <Col>
                        <h4 className="mb-1">42</h4>
                        <small className="text-muted">Cards Today</small>
                      </Col>
                      <Col>
                        <h4 className="mb-1">99%</h4>
                        <small className="text-muted">System Health</small>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </div>

            {isEmployee && (
              <>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="section-title mb-0">Employee Workspace</h2>
                  <span className="text-muted small">High-impact tools curated for you</span>
                </div>
                <Row className="g-4 mb-4">
                  {employeeActions.map((action, index) => (
                    <Col lg={3} md={6} key={action.title}>
                      <Card className="glass-card quick-action-card feature-card h-100">
                        <Card.Body>
                          <div className="feature-icon mb-3">{['📊', '💳', '🎫', '🗂'][index]}</div>
                          <Card.Title className="fw-semibold">{action.title}</Card.Title>
                          <Card.Text className="text-muted small">{action.description}</Card.Text>
                          <Link to={action.to} className="btn btn-sm btn-primary px-3">
                            Open
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {userRole === 'admin' && (
              <>
                <div className="d-flex align-items-center justify-content-between mb-3 mt-4">
                  <h2 className="section-title mb-0">Administrator Console</h2>
                  <span className="text-muted small">Governance · Security · Insights</span>
                </div>
                <Row className="g-4">
                  {adminActions.map((action, index) => (
                    <Col lg={3} md={6} key={action.title}>
                      <Card className="glass-card quick-action-card feature-card h-100">
                        <Card.Body>
                          <div className="feature-icon mb-3">{['🧑‍💼', '👥', '🎨', '🕒'][index]}</div>
                          <Card.Title className="fw-semibold">{action.title}</Card.Title>
                          <Card.Text className="text-muted small">{action.description}</Card.Text>
                          <Link to={action.to} className="btn btn-sm btn-outline-primary px-3">
                            Manage
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default Home;

