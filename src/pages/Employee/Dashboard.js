import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    myVisitingCards: 0,
    visitorsGenerated: 0,
    recentVisitors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      const [cardsSnapshot, visitorsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'visitingCards'), where('userId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'visitors'), where('hostEmployeeId', '==', currentUser.uid)))
      ]);

      setStats({
        myVisitingCards: cardsSnapshot.size,
        visitorsGenerated: visitorsSnapshot.size,
        recentVisitors: visitorsSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <h2 className="mb-4">Employee Dashboard</h2>
      <Row>
        <Col md={4} className="mb-4">
          <Card className="text-center glass-card stat-card h-100">
            <Card.Body>
              <Card.Title>My Visiting Cards</Card.Title>
              <h2>{stats.myVisitingCards}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="text-center glass-card stat-card h-100">
            <Card.Body>
              <Card.Title>Visitors Generated</Card.Title>
              <h2>{stats.visitorsGenerated}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="text-center glass-card stat-card h-100">
            <Card.Body>
              <Card.Title>Recent Visitors</Card.Title>
              <h2>{stats.recentVisitors}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EmployeeDashboard;

