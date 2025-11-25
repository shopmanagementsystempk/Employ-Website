import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from '../../utils/toast';
import { format } from 'date-fns';

const VisitorCard = () => {
  const { currentUser } = useAuth();
  const cardRef = useRef(null);
  const [formData, setFormData] = useState({
    visitorName: '',
    purpose: '',
    contact: '',
    hostEmployee: currentUser?.displayName || '',
    hostEmployeeId: currentUser?.uid || '',
    company: '',
    visitDate: format(new Date(), 'yyyy-MM-dd'),
    visitTime: format(new Date(), 'HH:mm')
  });
  const [generatedCard, setGeneratedCard] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateVisitorId = () => {
    return `VIS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const handleGenerate = () => {
    if (!formData.visitorName || !formData.purpose) {
      toast.error('Please fill in all required fields');
      return;
    }

    const visitorId = generateVisitorId();
    setGeneratedCard({
      visitorId,
      ...formData,
      generatedAt: new Date().toISOString()
    });
    toast.success('Visitor card generated!');
  };

  const downloadPNG = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `visitor_card_${formData.visitorName.replace(/\s/g, '_')}.png`;
      link.href = imgData;
      link.click();
      toast.success('PNG downloaded successfully!');
    } catch (error) {
      console.error('Error generating PNG:', error);
      toast.error('Failed to download PNG');
    }
  };

  const downloadPDF = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', [89, 51]);
      const imgWidth = 89;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`visitor_card_${formData.visitorName.replace(/\s/g, '_')}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const saveVisitor = async () => {
    if (!generatedCard) {
      toast.error('Please generate the card first');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'visitors'), {
        ...generatedCard,
        hostEmployeeId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
      toast.success('Visitor entry saved successfully!');
      
      // Reset form
      setFormData({
        visitorName: '',
        purpose: '',
        contact: '',
        hostEmployee: currentUser?.displayName || '',
        hostEmployeeId: currentUser?.uid || '',
        company: '',
        visitDate: format(new Date(), 'yyyy-MM-dd'),
        visitTime: format(new Date(), 'HH:mm')
      });
      setGeneratedCard(null);
    } catch (error) {
      console.error('Error saving visitor:', error);
      toast.error('Failed to save visitor entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Generate Visitor Card</h2>
      <Row>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Visitor Information</Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Visitor Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="visitorName"
                    value={formData.visitorName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Purpose of Visit *</Form.Label>
                  <Form.Control
                    type="text"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Company</Form.Label>
                  <Form.Control
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Host Employee</Form.Label>
                  <Form.Control
                    type="text"
                    name="hostEmployee"
                    value={formData.hostEmployee}
                    onChange={handleChange}
                    readOnly
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Visit Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="visitDate"
                    value={formData.visitDate}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Visit Time</Form.Label>
                  <Form.Control
                    type="time"
                    name="visitTime"
                    value={formData.visitTime}
                    onChange={handleChange}
                  />
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={handleGenerate}>
                    Generate Card
                  </Button>
                  {generatedCard && (
                    <Button variant="success" onClick={saveVisitor} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Visitor Entry'}
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Visitor Card Preview</Card.Title>
              {generatedCard ? (
                <>
                  <div
                    ref={cardRef}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      margin: '0 auto',
                      padding: '20px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      border: '2px solid #007bff',
                      borderRadius: '8px',
                      minHeight: '250px'
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <h5 style={{ marginBottom: '10px', color: '#007bff', fontWeight: 'bold' }}>
                        VISITOR CARD
                      </h5>
                      <hr style={{ margin: '10px 0' }} />
                      <h4 style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                        {formData.visitorName}
                      </h4>
                      <p style={{ marginBottom: '5px', fontSize: '14px' }}>
                        <strong>Purpose:</strong> {formData.purpose}
                      </p>
                      {formData.company && (
                        <p style={{ marginBottom: '5px', fontSize: '12px' }}>
                          <strong>Company:</strong> {formData.company}
                        </p>
                      )}
                      {formData.contact && (
                        <p style={{ marginBottom: '5px', fontSize: '12px' }}>
                          <strong>Contact:</strong> {formData.contact}
                        </p>
                      )}
                      <p style={{ marginBottom: '5px', fontSize: '12px' }}>
                        <strong>Host:</strong> {formData.hostEmployee}
                      </p>
                      <p style={{ marginBottom: '5px', fontSize: '12px' }}>
                        <strong>Date:</strong> {formData.visitDate} <strong>Time:</strong> {formData.visitTime}
                      </p>
                      <p style={{ marginBottom: '10px', fontSize: '10px', color: '#666' }}>
                        ID: {generatedCard.visitorId}
                      </p>
                      {/* QR code placeholder - implement if needed */}
                    </div>
                  </div>
                  <div className="d-grid gap-2 mt-3">
                    <Button variant="success" onClick={downloadPNG}>
                      Download PNG
                    </Button>
                    <Button variant="danger" onClick={downloadPDF}>
                      Download PDF
                    </Button>
                  </div>
                </>
              ) : (
                <Alert variant="info">
                  Fill in the form and click "Generate Card" to preview the visitor card.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VisitorCard;

