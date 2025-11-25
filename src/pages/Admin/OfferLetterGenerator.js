import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner
} from 'react-bootstrap';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import jsPDF from 'jspdf';
import { db } from '../../firebase/config';
import { toast } from '../../utils/toast';
import { useAuth } from '../../contexts/AuthContext';

const defaultLetterData = {
  employeeId: '',
  candidateName: '',
  jobTitle: '',
  department: '',
  salary: '',
  startDate: '',
  location: 'Soft Verse',
  employmentType: 'Full-time',
  reportingManager: '',
  probationPeriod: '3 months',
  offerDate: new Date().toISOString().slice(0, 10),
  benefits: 'Comprehensive health insurance, annual leave, learning stipend',
  notes: 'Please confirm your acceptance by signing and returning this letter.'
};

const companyLogo = `${process.env.PUBLIC_URL || ''}/logo.png`;

const OfferLetterGenerator = () => {
  const letterRef = useRef(null);
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [savingPdf, setSavingPdf] = useState(false);
  const [letterData, setLetterData] = useState(defaultLetterData);
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'employee'))
        );
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEmployees(list);
      } catch (error) {
        console.error('Failed to load employees:', error);
        toast.error('Unable to load employees');
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch(companyLogo);
        if (!response.ok) return;
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoDataUrl(reader.result);
        reader.readAsDataURL(blob);
      } catch (error) {
        console.warn('Unable to load logo for PDF:', error);
      }
    };

    loadLogo();
  }, []);

  const formatDisplayDate = (value) => {
    if (!value) return '____________';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const normalizeLocation = (loc) => {
    const base = loc || 'Soft Verse';
    return base.replace(/\s*HQ\s*$/i, '').trim();
  };

  const handleEmployeeSelect = (event) => {
    const selectedId = event.target.value;
    const employee = employees.find((emp) => emp.id === selectedId);
    setLetterData((prev) => ({
      ...prev,
      employeeId: selectedId,
      candidateName: employee?.name || '',
      jobTitle: employee?.designation || '',
      department: employee?.department || ''
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLetterData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const downloadPdf = async () => {
    setSavingPdf(true);
    try {
      await addDoc(collection(db, 'offerLetters'), {
        ...letterData,
        employeeId: letterData.employeeId || null,
        generatedAt: new Date().toISOString(),
        generatedBy: currentUser?.uid || null,
        generatedByEmail: currentUser?.email || null
      });

      const doc = new jsPDF('p', 'mm', 'a4');
      const marginX = 20;
      const marginY = 20;
      const contentWidth = doc.internal.pageSize.getWidth() - marginX * 2;
      const pageHeight = doc.internal.pageSize.getHeight();
      let cursorY = marginY;

      const moveToNextPage = () => {
        doc.addPage();
        cursorY = marginY;
      };

      const ensureSpace = (lineHeight) => {
        if (cursorY + lineHeight > pageHeight - marginY) {
          moveToNextPage();
        }
      };

      const addParagraph = (text, options = {}) => {
        const { fontSize = 11, fontStyle = 'normal', extraSpacing = 4 } = options;
        doc.setFont('times', fontStyle);
        doc.setFontSize(fontSize);

        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line) => {
          ensureSpace(fontSize / 2 + 2);
          doc.text(line, marginX, cursorY);
          cursorY += fontSize / 2 + 2;
        });
        cursorY += extraSpacing;
      };

      const addBullets = (items) => {
        doc.setFontSize(11);
        items.forEach(({ label, value }) => {
          ensureSpace(8);
          doc.setFont('times', 'normal');
          doc.text('•', marginX, cursorY);

          const startX = marginX + 6;
          const labelText = `${label}:`;
          doc.setFont('times', 'bold');
          doc.text(labelText, startX, cursorY);

          const labelWidth = doc.getTextWidth(`${labelText} `);
          const availableWidth = contentWidth - labelWidth - 6;
          doc.setFont('times', 'normal');
          const safeValue = value || '__________';
          const valueLines = doc.splitTextToSize(safeValue, availableWidth);

          valueLines.forEach((line, idx) => {
            const lineY = cursorY + idx * 6;
            ensureSpace(6);
            doc.text(line, startX + labelWidth, lineY);
            cursorY = lineY;
          });
          cursorY += 6;
        });
        cursorY += 2;
      };

      const addHeader = () => {
        const logoSize = 14;
        const spacing = 1;
        const subtitleGap = 20;
        const blockHeight = Math.max(logoSize, 24);
        const titleBaseline = cursorY + blockHeight / 2;
        const textX = logoDataUrl ? marginX + logoSize + spacing : marginX;

        if (logoDataUrl) {
          const logoY = cursorY + (blockHeight - logoSize) / 2;
          doc.addImage(logoDataUrl, 'PNG', marginX, logoY, logoSize, logoSize);
        }

        doc.setFont('times', 'bold');
        doc.setFontSize(30);
        doc.text('Soft Verse', textX, titleBaseline, { baseline: 'middle' });
        doc.setFont('times', 'bold');
        doc.setFontSize(20);
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        doc.text('Official Offer Letter', centerX, titleBaseline + subtitleGap, { align: 'center' });

        cursorY += blockHeight + subtitleGap;

        doc.setFont('times', 'italic');
        doc.setFontSize(11);
        const infoX = marginX;
        doc.text(normalizeLocation(letterData.location || 'Soft Verse'), infoX, cursorY);
        cursorY += 6;
        doc.text(
          letterData.offerDate ? formatDisplayDate(letterData.offerDate) : '',
          infoX,
          cursorY
        );
        cursorY += 10;
      };

      addHeader();

      addParagraph(`Dear ${letterData.candidateName || 'Candidate'},`, {
        fontStyle: 'bold'
      });
      addParagraph(
        `We are delighted to extend to you the offer of ${
          letterData.jobTitle || 'Job Title'
        } within our ${letterData.department || 'team'} at Soft Verse. Your experience and passion impressed us, and we are confident you will have an immediate impact.`,
        { extraSpacing: 6 }
      );
      addParagraph('The key details of this offer are highlighted below:', {
        fontStyle: 'italic',
        extraSpacing: 3
      });

      addBullets([
        { label: 'Start date', value: formatDisplayDate(letterData.startDate) },
        { label: 'Salary', value: letterData.salary || '__________' },
        { label: 'Employment type', value: letterData.employmentType || '__________' },
        { label: 'Reporting to', value: letterData.reportingManager || '__________' },
        { label: 'Probation period', value: letterData.probationPeriod || '__________' }
      ]);

      addParagraph(
        `Your role will be based at ${normalizeLocation(letterData.location || 'Soft Verse')} and will include access to the following benefits:`
      );
      addParagraph(
        letterData.benefits ||
          'Comprehensive health insurance, annual leave, and a dedicated learning stipend.'
      );
      addParagraph(
        letterData.notes ||
          'Please sign and return this letter to confirm your acceptance. We are excited to welcome you to the team.'
      );

      addParagraph('Sincerely,', { extraSpacing: 2 });
      addParagraph('HR Depertment', { fontStyle: 'bold', extraSpacing: 2 });
      addParagraph('Soft Verse', { fontStyle: 'bold', extraSpacing: 0 });

      doc.save(`${letterData.candidateName || 'offer-letter'}.pdf`);
      toast.success('Offer letter downloaded');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Unable to download offer letter');
    } finally {
      setSavingPdf(false);
    }
  };

  const readyToDownload =
    letterData.candidateName &&
    letterData.jobTitle &&
    letterData.startDate &&
    letterData.salary;

  return (
    <Container className="mt-4">
      <h2 className="mb-3">Offer Letter Generator</h2>
      <p className="text-muted mb-4">
        Create a personalized offer letter for any employee and export it as a PDF.
      </p>
      <Row>
        <Col lg={5} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Offer Details</Card.Title>
              {loadingEmployees ? (
                <div className="d-flex align-items-center gap-2 mt-3">
                  <Spinner size="sm" />
                  <span>Loading employees...</span>
                </div>
              ) : (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Employee</Form.Label>
                    <Form.Select
                      value={letterData.employeeId}
                      onChange={handleEmployeeSelect}
                    >
                      <option value="">Choose...</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name || employee.email}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Candidate Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="candidateName"
                      value={letterData.candidateName}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Job Title *</Form.Label>
                    <Form.Control
                      type="text"
                      name="jobTitle"
                      value={letterData.jobTitle}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Department</Form.Label>
                    <Form.Control
                      type="text"
                      name="department"
                      value={letterData.department}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Salary (annual) *</Form.Label>
                        <Form.Control
                          type="text"
                          name="salary"
                          placeholder="$60,000"
                          value={letterData.salary}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Start Date *</Form.Label>
                        <Form.Control
                          type="date"
                          name="startDate"
                          value={letterData.startDate}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Offer Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="offerDate"
                          value={letterData.offerDate}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Employment Type</Form.Label>
                        <Form.Select
                          name="employmentType"
                          value={letterData.employmentType}
                          onChange={handleChange}
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Internship">Internship</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      name="location"
                      value={letterData.location}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Reporting Manager</Form.Label>
                    <Form.Control
                      type="text"
                      name="reportingManager"
                      value={letterData.reportingManager}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Probation Period</Form.Label>
                    <Form.Control
                      type="text"
                      name="probationPeriod"
                      value={letterData.probationPeriod}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Benefits Summary</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="benefits"
                      value={letterData.benefits}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Additional Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="notes"
                      value={letterData.notes}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Button
                    variant="success"
                    className="w-100"
                    disabled={!readyToDownload || savingPdf}
                    onClick={downloadPdf}
                  >
                    {savingPdf ? 'Preparing letter...' : 'Download Offer Letter'}
                  </Button>
                  {!readyToDownload && (
                    <Alert variant="info" className="mt-3 mb-0">
                      Fill in candidate name, job title, start date, and salary to enable
                      the download button.
                    </Alert>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={7}>
          <Card>
            <Card.Body>
              <Card.Title>Letter Preview</Card.Title>
              <div
                ref={letterRef}
                className="offer-letter-preview"
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '40px',
                  marginTop: '20px',
                  boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)'
                }}
              >
                <header
                  style={{
                    marginBottom: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  {companyLogo && (
                    <img
                      src={companyLogo}
                      alt="Soft Verse logo"
                      style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                    />
                  )}
                  <div>
                    <h3 style={{ marginBottom: '5px' }}>Soft Verse</h3>
                  </div>
                </header>
                <p style={{ color: '#64748b', fontWeight: 700, textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>Official Offer Letter</p>
                <p style={{ color: '#475569' }}>{normalizeLocation(letterData.location) || 'Soft Verse'}</p>
                <p style={{ color: '#475569' }}>
                  {letterData.offerDate ? formatDisplayDate(letterData.offerDate) : ''}
                </p>
                <p>Dear {letterData.candidateName || 'Candidate'},</p>
                <p>
                  We are delighted to extend to you the offer of{' '}
                  <strong>{letterData.jobTitle || 'Job Title'}</strong> with our{' '}
                  {letterData.department || 'team'} at Soft Verse. Your experience and
                  passion impressed us, and we are confident you will have an immediate
                  impact.
                </p>
                <p>The key details of this offer are highlighted below:</p>
                <ul>
                  <li>
                    <strong>Start date:</strong> {formatDisplayDate(letterData.startDate)}
                  </li>
                  <li>
                    <strong>Salary:</strong> {letterData.salary || '__________'}
                  </li>
                  <li>
                    <strong>Employment type:</strong>{' '}
                    {letterData.employmentType || '__________'}
                  </li>
                  <li>
                    <strong>Reporting to:</strong>{' '}
                    {letterData.reportingManager || '__________'}
                  </li>
                  <li>
                    <strong>Probation period:</strong>{' '}
                    {letterData.probationPeriod || '__________'}
                  </li>
                </ul>
                <p>
                  Your role will be based at {letterData.location || 'Soft Verse'} and
                  will include access to the following benefits:
                </p>
                <p>{letterData.benefits}</p>
                <p>
                  {letterData.notes ||
                    'Please sign and return this letter to confirm your acceptance. We are excited to welcome you to the team.'}
                </p>
                <p style={{ marginTop: '30px' }}>
                  Sincerely,
                  <br />
                  <strong>HR Depertment</strong>
                  <br />
                  Soft Verse
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OfferLetterGenerator;
