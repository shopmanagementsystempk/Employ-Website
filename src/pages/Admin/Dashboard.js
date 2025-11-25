import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEmployees: 0,
    totalVisitors: 0,
    totalCards: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnapshot, employeesSnapshot, visitorsSnapshot, cardsSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(query(collection(db, 'users'), where('role', '==', 'employee'))),
          getDocs(collection(db, 'visitors')),
          getDocs(collection(db, 'visitingCards'))
        ]);

        setStats({
          totalUsers: usersSnapshot.size,
          totalEmployees: employeesSnapshot.size,
          totalVisitors: visitorsSnapshot.size,
          totalCards: cardsSnapshot.size
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      <Row>
        <Col md={3} className="mb-4">
          <Card className="text-center glass-card stat-card h-100">
            <Card.Body>
              <Card.Title>Total Users</Card.Title>
              <h2>{stats.totalUsers}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="text-center glass-card stat-card h-100">
            <Card.Body>
              <Card.Title>Employees</Card.Title>
              <h2>{stats.totalEmployees}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="text-center glass-card stat-card h-100">
            <Card.Body>
              <Card.Title>Total Visitors</Card.Title>
              <h2>{stats.totalVisitors}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="text-center glass-card stat-card h-100">
            <Card.Body>
              <Card.Title>Visiting Cards</Card.Title>
              <h2>{stats.totalCards}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;

