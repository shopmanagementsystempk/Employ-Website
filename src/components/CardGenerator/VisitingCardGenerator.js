import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
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
    addressColor: '#ffffff',
    nameOffsetX: 0,
    nameOffsetY: 0,
    titleOffsetX: 0,
    titleOffsetY: 0,
    designationOffsetX: 0,
    designationOffsetY: 0,
    companyOffsetX: 0,
    companyOffsetY: 0,
    phoneOffsetX: 0,
    phoneOffsetY: 0,
    emailOffsetX: 0,
    emailOffsetY: 0,
    websiteOffsetX: 0,
    websiteOffsetY: 0,
    addressOffsetX: 0,
    addressOffsetY: 0,
    logoUrl: '',
    logoColor: '#ffffff',
    logoOffsetX: 0,
    logoOffsetY: 0,
    nameSize: '',
    titleSize: '',
    designationSize: '',
    companySize: '',
    phoneSize: '',
    emailSize: '',
    websiteSize: '',
    addressSize: '',
    logoSize: ''
  });
  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
        setFormData((prev) => ({
          ...prev,
          name: userData.name || '',
          title: userData.title || '',
          phone: userData.phone || '',
          email: userData.email || currentUser.email || '',
          designation: userData.designation || '',
          company: userData.company || 'Soft Verse',
          address: userData.address || '',
          website: userData.website || '',
          textColor: prev.textColor,
          nameColor: prev.nameColor,
          titleColor: prev.titleColor,
          designationColor: prev.designationColor,
          companyColor: prev.companyColor,
          phoneColor: prev.phoneColor,
          emailColor: prev.emailColor,
          websiteColor: prev.websiteColor,
          addressColor: prev.addressColor
        }));
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const logoUrl = await uploadToCloudinary(file);
      if (logoUrl) {
        setFormData({
          ...formData,
          logoUrl
        });
        toast.success('Logo uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      setLogoFile(null);
    }
  };

  const getOffsetStyle = (field) => {
    const x = Number(formData[`${field}OffsetX`]) || 0;
    const y = Number(formData[`${field}OffsetY`]) || 0;
    if (!x && !y) return {};
    return { transform: `translate(${x}px, ${y}px)` };
  };

  const getSizeStyle = (field) => {
    const size = formData[`${field}Size`];
    if (!size) return {};
    // Support both px and rem units, default to px if no unit specified
    const sizeValue = size.toString().trim();
    if (sizeValue === '') return {};
    // If it's a number, assume px
    if (/^\d+$/.test(sizeValue)) {
      return { fontSize: `${sizeValue}px` };
    }
    // If it already has a unit, use it as is
    if (/^\d+(px|rem|em|pt)$/i.test(sizeValue)) {
      return { fontSize: sizeValue };
    }
    // Default to px if invalid format
    return { fontSize: `${sizeValue}px` };
  };

  const getLogoSizeStyle = () => {
    const size = formData.logoSize;
    if (!size) return { maxWidth: '120px', maxHeight: '80px' };
    const sizeValue = size.toString().trim();
    if (sizeValue === '') return { maxWidth: '120px', maxHeight: '80px' };
    
    // Check if it's width and height (e.g., "120px 80px")
    const parts = sizeValue.split(/\s+/);
    if (parts.length === 2) {
      return { width: parts[0], height: parts[1], maxWidth: parts[0], maxHeight: parts[1] };
    }
    // If single value, use as maxWidth and maintain aspect ratio
    if (/^\d+(px|rem|em|pt)$/i.test(sizeValue) || /^\d+$/.test(sizeValue)) {
      const width = /^\d+$/.test(sizeValue) ? `${sizeValue}px` : sizeValue;
      return { maxWidth: width, maxHeight: 'auto' };
    }
    return { maxWidth: '120px', maxHeight: '80px' };
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
      const timestamp = new Date().toISOString();
      await setDoc(doc(db, 'visitingCards', currentUser.uid), {
        ...formData,
        userId: currentUser.uid,
        templateId: selectedTemplateId,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      await addDoc(collection(db, 'visitingCardHistory'), {
        ...formData,
        userId: currentUser.uid,
        templateId: selectedTemplateId,
        generatedAt: timestamp,
        generatedByEmail: currentUser.email || '',
        templateName: templates.find((t) => t.id === selectedTemplateId)?.name || ''
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
                  <Form.Label className="mt-2">Font Size (e.g., 16px, 1.2rem)</Form.Label>
                  <Form.Control
                    type="text"
                    name="nameSize"
                    value={formData.nameSize}
                    onChange={handleChange}
                    placeholder="e.g., 18px"
                  />
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Horizontal Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="nameOffsetX"
                        value={formData.nameOffsetX}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Vertical Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="nameOffsetY"
                        value={formData.nameOffsetY}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>
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
                  <Form.Label className="mt-2">Font Size (e.g., 16px, 1.2rem)</Form.Label>
                  <Form.Control
                    type="text"
                    name="titleSize"
                    value={formData.titleSize}
                    onChange={handleChange}
                    placeholder="e.g., 14px"
                  />
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Horizontal Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="titleOffsetX"
                        value={formData.titleOffsetX}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Vertical Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="titleOffsetY"
                        value={formData.titleOffsetY}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>
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
                  <Form.Label className="mt-2">Font Size (e.g., 16px, 1.2rem)</Form.Label>
                  <Form.Control
                    type="text"
                    name="designationSize"
                    value={formData.designationSize}
                    onChange={handleChange}
                    placeholder="e.g., 14px"
                  />
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Horizontal Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="designationOffsetX"
                        value={formData.designationOffsetX}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Vertical Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="designationOffsetY"
                        value={formData.designationOffsetY}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>
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
                  <Form.Label className="mt-2">Font Size (e.g., 16px, 1.2rem)</Form.Label>
                  <Form.Control
                    type="text"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    placeholder="e.g., 12px"
                  />
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Horizontal Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="companyOffsetX"
                        value={formData.companyOffsetX}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Vertical Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="companyOffsetY"
                        value={formData.companyOffsetY}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>
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
                  <Form.Label className="mt-2">Font Size (e.g., 16px, 1.2rem)</Form.Label>
                  <Form.Control
                    type="text"
                    name="phoneSize"
                    value={formData.phoneSize}
                    onChange={handleChange}
                    placeholder="e.g., 11px"
                  />
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Horizontal Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="phoneOffsetX"
                        value={formData.phoneOffsetX}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Vertical Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="phoneOffsetY"
                        value={formData.phoneOffsetY}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>
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
                  <Form.Label className="mt-2">Font Size (e.g., 16px, 1.2rem)</Form.Label>
                  <Form.Control
                    type="text"
                    name="emailSize"
                    value={formData.emailSize}
                    onChange={handleChange}
                    placeholder="e.g., 11px"
                  />
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Horizontal Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="emailOffsetX"
                        value={formData.emailOffsetX}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Vertical Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="emailOffsetY"
                        value={formData.emailOffsetY}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>
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
                  <Form.Label className="mt-2">Font Size (e.g., 16px, 1.2rem)</Form.Label>
                  <Form.Control
                    type="text"
                    name="websiteSize"
                    value={formData.websiteSize}
                    onChange={handleChange}
                    placeholder="e.g., 11px"
                  />
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Horizontal Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="websiteOffsetX"
                        value={formData.websiteOffsetX}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Vertical Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="websiteOffsetY"
                        value={formData.websiteOffsetY}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>
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
                  <Form.Label className="mt-2">Font Size (e.g., 16px, 1.2rem)</Form.Label>
                  <Form.Control
                    type="text"
                    name="addressSize"
                    value={formData.addressSize}
                    onChange={handleChange}
                    placeholder="e.g., 11px"
                  />
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Horizontal Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="addressOffsetX"
                        value={formData.addressOffsetX}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Vertical Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="addressOffsetY"
                        value={formData.addressOffsetY}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Logo</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  {uploadingLogo && (
                    <Form.Text className="text-muted">Uploading logo...</Form.Text>
                  )}
                  {formData.logoUrl && (
                    <div className="mt-2">
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo preview" 
                        style={{ maxWidth: '100px', maxHeight: '60px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  <Form.Label className="mt-2">Text Color</Form.Label>
                  <Form.Control 
                    type="color" 
                    name="logoColor" 
                    value={formData.logoColor} 
                    onChange={handleChange} 
                  />
                  <Form.Label className="mt-2">Size (e.g., 120px, 80px)</Form.Label>
                  <Form.Control
                    type="text"
                    name="logoSize"
                    value={formData.logoSize}
                    onChange={handleChange}
                    placeholder="e.g., 120px 80px (width height)"
                  />
                  <Form.Text className="text-muted">
                    Enter width and height separated by space (e.g., "120px 80px") or just width (e.g., "100px")
                  </Form.Text>
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Horizontal Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="logoOffsetX"
                        value={formData.logoOffsetX}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label className="small text-muted">Vertical Offset (px)</Form.Label>
                      <Form.Control
                        type="number"
                        name="logoOffsetY"
                        value={formData.logoOffsetY}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>
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
                      {formData.logoUrl && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '10px', 
                          left: '10px', 
                          zIndex: 10,
                          transform: `translate(${Number(formData.logoOffsetX) || 0}px, ${Number(formData.logoOffsetY) || 0}px)`
                        }}>
                          <img src={formData.logoUrl} alt="Logo" style={{
                            ...getLogoSizeStyle(),
                            objectFit: 'contain',
                            filter: formData.logoColor && formData.logoColor !== '#ffffff' 
                              ? `drop-shadow(0 0 2px ${formData.logoColor})` 
                              : 'none'
                          }} />
                        </div>
                      )}
                      <div className="template-overlay-inner">
                        <div>
                          <h4 style={{ color: formData.nameColor || formData.textColor, ...getOffsetStyle('name'), ...getSizeStyle('name') }}>
                            {formData.name || 'Your Name'}
                          </h4>
                          <p style={{ color: formData.designationColor || formData.textColor, ...getOffsetStyle('designation'), ...getSizeStyle('designation') }}>
                            {formData.designation || 'Designation'}
                          </p>
                          {formData.title && (
                            <small style={{ color: formData.titleColor || formData.textColor, ...getOffsetStyle('title'), ...getSizeStyle('title') }}>{formData.title}</small>
                          )}
                        </div>
                        <div className="template-overlay-contact">
                          {formData.phone && (
                            <span style={{ color: formData.phoneColor || formData.textColor, ...getOffsetStyle('phone'), ...getSizeStyle('phone') }}>
                              📞 {formData.phone}
                            </span>
                          )}
                          {formData.email && (
                            <span style={{ color: formData.emailColor || formData.textColor, ...getOffsetStyle('email'), ...getSizeStyle('email') }}>
                              ✉️ {formData.email}
                            </span>
                          )}
                          {formData.website && (
                            <span style={{ color: formData.websiteColor || formData.textColor, ...getOffsetStyle('website'), ...getSizeStyle('website') }}>
                              🌐 {formData.website}
                            </span>
                          )}
                          {formData.address && (
                            <span style={{ color: formData.addressColor || formData.textColor, ...getOffsetStyle('address'), ...getSizeStyle('address') }}>
                              📍 {formData.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : template?.layout === 'softverse-premium' ? (
                  <div className="card-softverse-premium">
                    {formData.logoUrl && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '10px', 
                        zIndex: 10,
                        transform: `translate(${Number(formData.logoOffsetX) || 0}px, ${Number(formData.logoOffsetY) || 0}px)`
                      }}>
                        <img src={formData.logoUrl} alt="Logo" style={{
                          ...getLogoSizeStyle(),
                          objectFit: 'contain',
                          filter: formData.logoColor && formData.logoColor !== '#ffffff' 
                            ? `drop-shadow(0 0 2px ${formData.logoColor})` 
                            : 'none'
                        }} />
                      </div>
                    )}
                    <div className="card-softverse-premium-inner">
                    <div className="svp-main">
                      <div className="svp-name-block">
                        <h4 style={{ color: formData.nameColor || formData.textColor, ...getOffsetStyle('name'), ...getSizeStyle('name') }}>{formData.name || 'M. Sarmad Naeem'}</h4>
                        <p className="svp-role" style={{ color: formData.designationColor || formData.textColor, ...getOffsetStyle('designation'), ...getSizeStyle('designation') }}>
                          {formData.designation || 'CEO'}
                        </p>
                        {formData.title && (
                          <p className="svp-title" style={{ color: formData.titleColor || formData.textColor, ...getOffsetStyle('title'), ...getSizeStyle('title') }}>{formData.title}</p>
                        )}
                      </div>
                      <div className="svp-logo-block">
                        <div className="svp-logo-mark">SV</div>
                        <div className="svp-logo-text" style={{ color: formData.companyColor || formData.textColor, ...getOffsetStyle('company'), ...getSizeStyle('company') }}>
                          {formData.company || 'SoftVerse'}
                        </div>
                      </div>
                    </div>
                    <div className="svp-contact">
                      {formData.phone && (
                        <div className="svp-contact-row" style={getOffsetStyle('phone')}>
                          <span>📞</span>
                          <span style={{ color: formData.phoneColor || formData.textColor, ...getSizeStyle('phone') }}>{formData.phone}</span>
                        </div>
                      )}
                      {formData.email && (
                        <div className="svp-contact-row" style={getOffsetStyle('email')}>
                          <span>✉️</span>
                          <span style={{ color: formData.emailColor || formData.textColor, ...getSizeStyle('email') }}>{formData.email}</span>
                        </div>
                      )}
                      {formData.website && (
                        <div className="svp-contact-row" style={getOffsetStyle('website')}>
                          <span>🌐</span>
                          <span style={{ color: formData.websiteColor || formData.textColor, ...getSizeStyle('website') }}>{formData.website}</span>
                        </div>
                      )}
                      {formData.address && (
                        <div className="svp-contact-row" style={getOffsetStyle('address')}>
                          <span>📍</span>
                          <span style={{ color: formData.addressColor || formData.textColor, ...getSizeStyle('address') }}>{formData.address}</span>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', position: 'relative' }}>
                    {formData.logoUrl && (
                      <div style={{ 
                        marginBottom: '10px',
                        display: 'inline-block',
                        transform: `translate(${Number(formData.logoOffsetX) || 0}px, ${Number(formData.logoOffsetY) || 0}px)`
                      }}>
                        <img src={formData.logoUrl} alt="Logo" style={{
                          ...getLogoSizeStyle(),
                          objectFit: 'contain',
                          filter: formData.logoColor && formData.logoColor !== '#ffffff' 
                            ? `drop-shadow(0 0 2px ${formData.logoColor})` 
                            : 'none'
                        }} />
                      </div>
                    )}
                    <h4
                      style={{
                        marginBottom: '10px',
                        fontWeight: 'bold',
                        color: formData.nameColor || formData.textColor,
                        ...getOffsetStyle('name'),
                        ...getSizeStyle('name')
                      }}
                    >
                      {formData.name || 'Your Name'}
                    </h4>
                    <p
                      style={{
                        marginBottom: '5px',
                        fontSize: '14px',
                        color: formData.designationColor || formData.textColor,
                        ...getOffsetStyle('designation'),
                        ...getSizeStyle('designation')
                      }}
                    >
                      {formData.designation || 'Designation'}
                    </p>
                    {formData.title && (
                      <p
                        style={{
                          marginBottom: '5px',
                          fontSize: '12px',
                          color: formData.titleColor || formData.textColor,
                          ...getOffsetStyle('title'),
                          ...getSizeStyle('title')
                        }}
                      >
                        {formData.title}
                      </p>
                    )}
                    <p
                      style={{
                        marginBottom: '5px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: formData.companyColor || formData.textColor,
                        ...getOffsetStyle('company'),
                        ...getSizeStyle('company')
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
                        <p style={{ margin: '3px 0', color: formData.phoneColor || formData.textColor, ...getOffsetStyle('phone'), ...getSizeStyle('phone') }}>
                          📞 {formData.phone}
                        </p>
                      )}
                      {formData.email && (
                        <p style={{ margin: '3px 0', color: formData.emailColor || formData.textColor, ...getOffsetStyle('email'), ...getSizeStyle('email') }}>
                          ✉️ {formData.email}
                        </p>
                      )}
                      {formData.website && (
                        <p style={{ margin: '3px 0', color: formData.websiteColor || formData.textColor, ...getOffsetStyle('website'), ...getSizeStyle('website') }}>
                          🌐 {formData.website}
                        </p>
                      )}
                      {formData.address && (
                        <p style={{ margin: '3px 0', color: formData.addressColor || formData.textColor, ...getOffsetStyle('address'), ...getSizeStyle('address') }}>
                          📍 {formData.address}
                        </p>
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

