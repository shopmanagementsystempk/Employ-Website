import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Badge } from 'react-bootstrap';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      let q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100));
      
      if (filter !== 'all') {
        q = query(
          collection(db, 'activityLogs'),
          where('action', '==', filter),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      const logsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logsList);
    } catch (error) {
      console.error('Error fetching logs:', error);
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
        <h2>Activity Logs</h2>
        <Form.Select
          style={{ width: '200px' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="card_generated">Card Generated</option>
        </Form.Select>
      </div>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Details</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">No logs found</td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id}>
                <td>{log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : 'N/A'}</td>
                <td>{log.userEmail || 'N/A'}</td>
                <td>
                  <Badge bg={
                    log.action === 'login' ? 'success' :
                    log.action === 'logout' ? 'secondary' :
                    log.action === 'create' ? 'primary' :
                    log.action === 'update' ? 'warning' :
                    log.action === 'delete' ? 'danger' : 'info'
                  }>
                    {log.action}
                  </Badge>
                </td>
                <td>{log.details || 'N/A'}</td>
                <td>{log.ipAddress || 'N/A'}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default ActivityLogs;

