import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Badge } from 'react-bootstrap';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const VisitorHistory = () => {
  const { currentUser } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (currentUser) {
      fetchVisitors();
    }
  }, [currentUser, filter]);

  const fetchVisitors = async () => {
    try {
      let q = query(
        collection(db, 'visitors'),
        where('hostEmployeeId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const visitorsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by date if needed
      let filtered = visitorsList;
      if (filter === 'today') {
        const today = format(new Date(), 'yyyy-MM-dd');
        filtered = visitorsList.filter(v => v.visitDate === today);
      } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = visitorsList.filter(v => new Date(v.visitDate) >= weekAgo);
      }

      setVisitors(filtered);
    } catch (error) {
      console.error('Error fetching visitors:', error);
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Visitor History</h2>
        <Form.Select
          style={{ width: '200px' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Visitors</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
        </Form.Select>
      </div>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Visitor ID</th>
            <th>Visitor Name</th>
            <th>Purpose</th>
            <th>Company</th>
            <th>Contact</th>
            <th>Visit Date</th>
            <th>Visit Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {visitors.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center">No visitors found</td>
            </tr>
          ) : (
            visitors.map((visitor) => (
              <tr key={visitor.id}>
                <td>{visitor.visitorId || 'N/A'}</td>
                <td>{visitor.visitorName}</td>
                <td>{visitor.purpose}</td>
                <td>{visitor.company || 'N/A'}</td>
                <td>{visitor.contact || 'N/A'}</td>
                <td>{visitor.visitDate || 'N/A'}</td>
                <td>{visitor.visitTime || 'N/A'}</td>
                <td>
                  <Badge bg="success">Active</Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default VisitorHistory;

