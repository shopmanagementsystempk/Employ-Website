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
    visitTime: format(new Date(), 'HH:mm'),
    backgroundImageUrl: ''
  });
  const [generatedCard, setGeneratedCard] = useState(null);
  const [saving, setSaving] = useState(false);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast.error('Cloudinary configuration missing.');
      return '';
    }

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: data
    });

    const json = await res.json();
    if (res.ok && json.secure_url) {
      return json.secure_url;
    }
    console.error('Cloudinary upload error:', json);
    toast.error(json.error?.message || 'Cloudinary upload failed.');
    return '';
  };

  const handleBackgroundImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBackground(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      if (imageUrl) {
        setFormData({
          ...formData,
          backgroundImageUrl: imageUrl
        });
        toast.success('Background image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading background image:', error);
      toast.error('Failed to upload background image');
    } finally {
      setUploadingBackground(false);
      setBackgroundImageFile(null);
    }
  };

  const handleRemoveBackgroundImage = () => {
    setFormData({
      ...formData,
      backgroundImageUrl: ''
    });
    toast.success('Background image removed successfully!');
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
        backgroundColor: formData.backgroundImageUrl ? null : '#ffffff',
        scale: 2,
        useCORS: true
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
        backgroundColor: formData.backgroundImageUrl ? null : '#ffffff',
        scale: 2,
        useCORS: true
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
        visitTime: format(new Date(), 'HH:mm'),
        backgroundImageUrl: ''
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
                <Form.Group className="mb-3">
                  <Form.Label>Background Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageUpload}
                    disabled={uploadingBackground}
                  />
                  {uploadingBackground && (
                    <Form.Text className="text-muted">Uploading background image...</Form.Text>
                  )}
                  {formData.backgroundImageUrl && (
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <img 
                        src={formData.backgroundImageUrl} 
                        alt="Background preview" 
                        style={{ maxWidth: '150px', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={handleRemoveBackgroundImage}
                      >
                        Remove Background
                      </Button>
                    </div>
                  )}
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
                      backgroundColor: formData.backgroundImageUrl ? 'transparent' : '#ffffff',
                      backgroundImage: formData.backgroundImageUrl ? `url(${formData.backgroundImageUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      color: formData.backgroundImageUrl ? '#ffffff' : '#000000',
                      border: '2px solid #007bff',
                      borderRadius: '8px',
                      minHeight: '250px',
                      position: 'relative'
                    }}
                  >
                    {formData.backgroundImageUrl && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        zIndex: 0
                      }} />
                    )}
                    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                      <h5 style={{ marginBottom: '10px', color: formData.backgroundImageUrl ? '#ffffff' : '#007bff', fontWeight: 'bold', textShadow: formData.backgroundImageUrl ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none' }}>
                        VISITOR CARD
                      </h5>
                      <hr style={{ margin: '10px 0' }} />
                      <h4 style={{ marginBottom: '10px', fontWeight: 'bold', textShadow: formData.backgroundImageUrl ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none' }}>
                        {formData.visitorName}
                      </h4>
                      <p style={{ marginBottom: '5px', fontSize: '14px', textShadow: formData.backgroundImageUrl ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none' }}>
                        <strong>Purpose:</strong> {formData.purpose}
                      </p>
                      {formData.company && (
                        <p style={{ marginBottom: '5px', fontSize: '12px', textShadow: formData.backgroundImageUrl ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none' }}>
                          <strong>Company:</strong> {formData.company}
                        </p>
                      )}
                      {formData.contact && (
                        <p style={{ marginBottom: '5px', fontSize: '12px', textShadow: formData.backgroundImageUrl ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none' }}>
                          <strong>Contact:</strong> {formData.contact}
                        </p>
                      )}
                      <p style={{ marginBottom: '5px', fontSize: '12px', textShadow: formData.backgroundImageUrl ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none' }}>
                        <strong>Host:</strong> {formData.hostEmployee}
                      </p>
                      <p style={{ marginBottom: '5px', fontSize: '12px', textShadow: formData.backgroundImageUrl ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none' }}>
                        <strong>Date:</strong> {formData.visitDate} <strong>Time:</strong> {formData.visitTime}
                      </p>
                      <p style={{ marginBottom: '10px', fontSize: '10px', color: formData.backgroundImageUrl ? '#ffffff' : '#666', textShadow: formData.backgroundImageUrl ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none' }}>
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

