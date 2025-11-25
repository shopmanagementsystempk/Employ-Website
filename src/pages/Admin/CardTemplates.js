import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { collection, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from '../../utils/toast';

const CardTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    layout: 'standard'
  });
  const [imageFile, setImageFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

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

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'cardTemplates'));
      const templatesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTemplates(templatesList);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async (event) => {
    event?.preventDefault();
    try {
      let imageUrl = '';
      let logoUrl = '';
      
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      if (logoFile) {
        logoUrl = await uploadToCloudinary(logoFile);
      }

      await addDoc(collection(db, 'cardTemplates'), {
        ...formData,
        imageUrl,
        logoUrl,
        createdAt: new Date().toISOString(),
        isActive: true
      });

      toast.success('Template added successfully');
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        layout: 'standard'
      });
      setImageFile(null);
      setLogoFile(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Failed to add template');
    }
  };

  const handleDelete = async (templateId, imageUrl) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteDoc(doc(db, 'cardTemplates', templateId));
        toast.success('Template deleted successfully');
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
      }
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
        <h2>Card Templates</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>Add Template</Button>
      </div>
      <Row>
        {templates.map((template) => (
          <Col md={4} key={template.id} className="mb-4">
            <Card>
              {template.logoUrl && (
                <div className="p-3 d-flex justify-content-center">
                  <img
                    src={template.logoUrl}
                    alt={`${template.name} logo`}
                    style={{ maxHeight: '60px', objectFit: 'contain' }}
                  />
                </div>
              )}
              {template.imageUrl && (
                <Card.Img variant="top" src={template.imageUrl} style={{ height: '200px', objectFit: 'cover' }} />
              )}
              <Card.Body>
                <Card.Title>{template.name}</Card.Title>
                <Card.Text>{template.description}</Card.Text>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(template.id, template.imageUrl)}
                >
                  Delete
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Card Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form id="card-template-form" onSubmit={handleAddTemplate}>
            <Form.Group className="mb-3">
              <Form.Label>Template Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Background Color</Form.Label>
              <Form.Control
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Text Color</Form.Label>
              <Form.Control
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Layout</Form.Label>
              <Form.Select
                value={formData.layout}
                onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
              >
                <option value="standard">Standard</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="softverse-premium">SoftVerse Premium (gold/burgundy)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Template Image (Optional)</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Logo (Cloudinary, Optional)</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files[0])}
              />
              <Form.Text muted>
                This logo is uploaded to Cloudinary and can be used in premium card layouts.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" form="card-template-form">
            Add Template
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CardTemplates;

