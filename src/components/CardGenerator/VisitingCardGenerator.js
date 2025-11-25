import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from '../../utils/toast';

const VisitingCardGenerator = () => {
  const { currentUser } = useAuth();
  const cardRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    phone: '',
    email: '',
    designation: '',
    company: 'Soft Verse',
    address: '',
    website: '',
    textColor: '#ffffff',
    nameColor: '#ffffff',
    titleColor: '#ffffff',
    designationColor: '#ffffff',
    companyColor: '#ffffff',
    phoneColor: '#ffffff',
    emailColor: '#ffffff',
    websiteColor: '#ffffff',
    addressColor: '#ffffff'
  });
  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchTemplates();
  }, [currentUser]);

  const fetchUserData = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFormData({
          name: userData.name || '',
          title: userData.title || '',
          phone: userData.phone || '',
          email: userData.email || currentUser.email || '',
          designation: userData.designation || '',
          company: userData.company || 'Soft Verse',
          address: userData.address || '',
          website: userData.website || '',
          textColor: '#ffffff',
          nameColor: '#ffffff',
          titleColor: '#ffffff',
          designationColor: '#ffffff',
          companyColor: '#ffffff',
          phoneColor: '#ffffff',
          emailColor: '#ffffff',
          websiteColor: '#ffffff',
          addressColor: '#ffffff'
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'cardTemplates'));
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(list);
        // If no template selected yet, default to first
        if (!template && list.length > 0) {
          setTemplate(list[0]);
          setSelectedTemplateId(list[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTemplateChange = (e) => {
    const value = e.target.value;
    setSelectedTemplateId(value);
    const found = templates.find((t) => t.id === value);
    if (found) {
      setTemplate(found);
    }
  };

  const downloadPNG = async () => {
    if (!cardRef.current) return;

    try {
      const bg =
        template?.layout === 'softverse-premium'
          ? null
          : template?.imageUrl
          ? null
          : template?.backgroundColor || '#ffffff';

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: bg === null ? undefined : bg,
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${formData.name}_visiting_card.png`;
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
      const bg =
        template?.layout === 'softverse-premium'
          ? null
          : template?.imageUrl
          ? null
          : template?.backgroundColor || '#ffffff';

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: bg === null ? undefined : bg,
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', [89, 51]); // Standard business card size
      const imgWidth = 89;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${formData.name}_visiting_card.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const saveCard = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'visitingCards', currentUser.uid), {
        ...formData,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Card saved successfully!');
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error('Failed to save card');
    } finally {
      setSaving(false);
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
      <h2 className="mb-4">Generate Visiting Card</h2>
      <Row>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Card Information</Card.Title>
              <Form>
                {templates.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Template</Form.Label>
                    <Form.Select
                      value={selectedTemplateId}
                      onChange={handleTemplateChange}
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name || 'Untitled template'}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Text Color</Form.Label>
                  <Form.Control
                    type="color"
                    name="textColor"
                    value={formData.textColor}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <Form.Label className="mt-2">Text Color</Form.Label>
                  <Form.Control type="color" name="nameColor" value={formData.nameColor} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                  />
                  <Form.Label className="mt-2">Text Color</Form.Label>
                  <Form.Control type="color" name="titleColor" value={formData.titleColor} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Designation *</Form.Label>
                  <Form.Control
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    required
                  />
                  <Form.Label className="mt-2">Text Color</Form.Label>
                  <Form.Control type="color" name="designationColor" value={formData.designationColor} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Company</Form.Label>
                  <Form.Control
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                  <Form.Label className="mt-2">Text Color</Form.Label>
                  <Form.Control type="color" name="companyColor" value={formData.companyColor} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  <Form.Label className="mt-2">Text Color</Form.Label>
                  <Form.Control type="color" name="phoneColor" value={formData.phoneColor} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Form.Label className="mt-2">Text Color</Form.Label>
                  <Form.Control type="color" name="emailColor" value={formData.emailColor} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                  />
                  <Form.Label className="mt-2">Text Color</Form.Label>
                  <Form.Control type="color" name="websiteColor" value={formData.websiteColor} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                  <Form.Label className="mt-2">Text Color</Form.Label>
                  <Form.Control type="color" name="addressColor" value={formData.addressColor} onChange={handleChange} />
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={saveCard} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Card'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Card Preview</Card.Title>
              <div
                ref={cardRef}
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  margin: '0 auto',
                  minHeight: '260px',
                  position: 'relative'
                }}
              >
                {template?.imageUrl ? (
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2)'
                    }}
                  >
                    <img
                      src={template.imageUrl}
                      alt="template background"
                      style={{
                        width: '100%',
                        display: 'block',
                        objectFit: 'cover',
                        minHeight: '260px'
                      }}
                    />
                    <div className="template-overlay" style={{ color: formData.textColor }}>
                      <div className="template-overlay-inner">
                        <div>
                          <h4 style={{ color: formData.nameColor || formData.textColor }}>
                            {formData.name || 'Your Name'}
                          </h4>
                          <p style={{ color: formData.designationColor || formData.textColor }}>
                            {formData.designation || 'Designation'}
                          </p>
                          {formData.title && (
                            <small style={{ color: formData.titleColor || formData.textColor }}>{formData.title}</small>
                          )}
                        </div>
                        <div className="template-overlay-contact">
                          {formData.phone && <span style={{ color: formData.phoneColor || formData.textColor }}>📞 {formData.phone}</span>}
                          {formData.email && <span style={{ color: formData.emailColor || formData.textColor }}>✉️ {formData.email}</span>}
                          {formData.website && <span style={{ color: formData.websiteColor || formData.textColor }}>🌐 {formData.website}</span>}
                          {formData.address && (
                            <span style={{ color: formData.addressColor || formData.textColor }}>📍 {formData.address}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : template?.layout === 'softverse-premium' ? (
                  <div className="card-softverse-premium">
                    <div className="card-softverse-premium-inner">
                    <div className="svp-main">
                      <div className="svp-name-block">
                        <h4 style={{ color: formData.nameColor || formData.textColor }}>{formData.name || 'M. Sarmad Naeem'}</h4>
                        <p className="svp-role" style={{ color: formData.designationColor || formData.textColor }}>
                          {formData.designation || 'CEO'}
                        </p>
                        {formData.title && (
                          <p className="svp-title" style={{ color: formData.titleColor || formData.textColor }}>{formData.title}</p>
                        )}
                      </div>
                      <div className="svp-logo-block">
                        <div className="svp-logo-mark">SV</div>
                        <div className="svp-logo-text" style={{ color: formData.companyColor || formData.textColor }}>
                          {formData.company || 'SoftVerse'}
                        </div>
                      </div>
                    </div>
                    <div className="svp-contact">
                      {formData.phone && (
                        <div className="svp-contact-row">
                          <span>📞</span>
                          <span style={{ color: formData.phoneColor || formData.textColor }}>{formData.phone}</span>
                        </div>
                      )}
                      {formData.email && (
                        <div className="svp-contact-row">
                          <span>✉️</span>
                          <span style={{ color: formData.emailColor || formData.textColor }}>{formData.email}</span>
                        </div>
                      )}
                      {formData.website && (
                        <div className="svp-contact-row">
                          <span>🌐</span>
                          <span style={{ color: formData.websiteColor || formData.textColor }}>{formData.website}</span>
                        </div>
                      )}
                      {formData.address && (
                        <div className="svp-contact-row">
                          <span>📍</span>
                          <span style={{ color: formData.addressColor || formData.textColor }}>{formData.address}</span>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <h4
                      style={{
                        marginBottom: '10px',
                        fontWeight: 'bold',
                        color: formData.nameColor || formData.textColor
                      }}
                    >
                      {formData.name || 'Your Name'}
                    </h4>
                    <p style={{ marginBottom: '5px', fontSize: '14px', color: formData.designationColor || formData.textColor }}>
                      {formData.designation || 'Designation'}
                    </p>
                    {formData.title && (
                      <p style={{ marginBottom: '5px', fontSize: '12px', color: formData.titleColor || formData.textColor }}>
                        {formData.title}
                      </p>
                    )}
                    <p
                      style={{
                        marginBottom: '5px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: formData.companyColor || formData.textColor
                      }}
                    >
                      {formData.company}
                    </p>
                    <hr style={{ margin: '15px 0' }} />
                    <div
                      style={{
                        fontSize: '11px',
                        lineHeight: '1.6'
                      }}
                    >
                      {formData.phone && (
                        <p style={{ margin: '3px 0', color: formData.phoneColor || formData.textColor }}>📞 {formData.phone}</p>
                      )}
                      {formData.email && (
                        <p style={{ margin: '3px 0', color: formData.emailColor || formData.textColor }}>✉️ {formData.email}</p>
                      )}
                      {formData.website && (
                        <p style={{ margin: '3px 0', color: formData.websiteColor || formData.textColor }}>🌐 {formData.website}</p>
                      )}
                      {formData.address && (
                        <p style={{ margin: '3px 0', color: formData.addressColor || formData.textColor }}>📍 {formData.address}</p>
                      )}
                    </div>
                    {/* QR code placeholder - implement if needed */}
                  </div>
                )}
              </div>
              <div className="d-grid gap-2 mt-3">
                <Button variant="success" onClick={downloadPNG}>
                  Download PNG
                </Button>
                <Button variant="danger" onClick={downloadPDF}>
                  Download PDF
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VisitingCardGenerator;

