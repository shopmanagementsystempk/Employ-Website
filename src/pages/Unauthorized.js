import React from 'react';
import { Container, Alert } from 'react-bootstrap';

const Unauthorized = () => {
  return (
    <Container className="mt-5">
      <Alert variant="danger">
        <Alert.Heading>Access Denied</Alert.Heading>
        <p>You don't have permission to access this page.</p>
        <hr />
        <a href="/" className="btn btn-primary">Go to Home</a>
      </Alert>
    </Container>
  );
};

export default Unauthorized;

