import React, { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import { db } from '../../firebase/config';
import { toast } from '../../utils/toast';
import { useAuth } from '../../contexts/AuthContext';

const defaultLetterData = {
  employeeId: '',
  candidateName: '',
  jobTitle: '',
  department: '',
  appointmentDate: '',
  appointmentTime: '',
  venue: 'Soft Verse HQ, Conference Room 3A',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  documents: 'Government ID, resume, educational certificates',
  notes: 'Please arrive 15 minutes early for registration.',
  reportTo: '',
  issueDate: new Date().toISOString().slice(0, 10)
};

const AppointmentLetterGenerator = () => {
  const { currentUser } = useAuth();
  const letterRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [savingPdf, setSavingPdf] = useState(false);
  const [letterData, setLetterData] = useState(defaultLetterData);

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

  const handleEmployeeSelect = (event) => {
    const selectedId = event.target.value;
    const employee = employees.find((emp) => emp.id === selectedId);
    setLetterData((prev) => ({
      ...prev,
      employeeId: selectedId,
      candidateName: employee?.name || '',
      jobTitle: employee?.designation || '',
      department: employee?.department || '',
      reportTo: employee?.manager || employee?.supervisor || ''
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
      const doc = new jsPDF('p', 'mm', 'a4');
      const marginX = 20;
      const marginY = 20;
      const contentWidth = doc.internal.pageSize.getWidth() - marginX * 2;
      const pageHeight = doc.internal.pageSize.getHeight();
      let cursorY = marginY;

      const ensureSpace = (lineHeight) => {
        if (cursorY + lineHeight > pageHeight - marginY) {
          doc.addPage();
          cursorY = marginY;
        }
      };

      const addParagraph = (text, options = {}) => {
        const { fontSize = 11, fontStyle = 'normal', extraSpacing = 5 } = options;
        doc.setFont('times', fontStyle);
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line) => {
          ensureSpace(fontSize / 2 + 3);
          doc.text(line, marginX, cursorY);
          cursorY += fontSize / 2 + 3;
        });
        cursorY += extraSpacing;
      };

      const addHeader = () => {
        doc.setFont('times', 'bold');
        doc.setFontSize(20);
        doc.text('Soft Verse', marginX, cursorY);
        doc.setFont('times', 'italic');
        doc.setFontSize(12);
        doc.text('Appointment Letter', marginX, cursorY + 8);
        cursorY += 20;
      };

      addHeader();
      addParagraph(letterData.venue || 'Soft Verse HQ', { fontStyle: 'italic', extraSpacing: 2 });
      addParagraph(formatDisplayDate(letterData.issueDate), { fontStyle: 'italic', extraSpacing: 8 });

      addParagraph(`Dear ${letterData.candidateName || 'Candidate'},`, { fontStyle: 'bold' });
      addParagraph(
        `We are pleased to confirm your appointment for the position of ${
          letterData.jobTitle || '__________'
        } within our ${letterData.department || '__________'} team.`
      );
      addParagraph('Please find the details for your appointment session below:', {
        fontStyle: 'italic',
        extraSpacing: 3
      });

      const detailItems = [
        { label: 'Appointment Date', value: formatDisplayDate(letterData.appointmentDate) },
        { label: 'Appointment Time', value: letterData.appointmentTime || '__________' },
        { label: 'Venue', value: letterData.venue || '__________' },
        { label: 'Reporting To', value: letterData.reportTo || '__________' },
        { label: 'Contact Person', value: letterData.contactPerson || '__________' },
        { label: 'Contact Email', value: letterData.contactEmail || '__________' },
        { label: 'Contact Phone', value: letterData.contactPhone || '__________' }
      ];

      const addDetailList = (items) => {
        doc.setFontSize(11);
        items.forEach(({ label, value }) => {
          ensureSpace(8);
          doc.setFont('times', 'normal');
          doc.text('•', marginX, cursorY);
          const startX = marginX + 6;
          doc.setFont('times', 'bold');
          const labelText = `${label}:`;
          doc.text(labelText, startX, cursorY);
          const labelWidth = doc.getTextWidth(`${labelText} `);
          doc.setFont('times', 'normal');
          const lines = doc.splitTextToSize(value || '__________', contentWidth - labelWidth - 6);
          lines.forEach((line, idx) => {
            const lineY = cursorY + idx * 6;
            ensureSpace(6);
            doc.text(line, startX + labelWidth, lineY);
            cursorY = lineY;
          });
          cursorY += 6;
        });
        cursorY += 2;
      };

      addDetailList(detailItems);

      addParagraph(
        `Please bring the following documents: ${letterData.documents || '__________'}.`
      );
      addParagraph(
        letterData.notes ||
          'Kindly arrive 15 minutes before your scheduled time to complete the necessary formalities.'
      );
      addParagraph('We look forward to meeting you and welcoming you to Soft Verse.');
      addParagraph('Sincerely,', { extraSpacing: 2 });
      addParagraph('People Operations', { fontStyle: 'bold', extraSpacing: 2 });
      addParagraph('Soft Verse', { fontStyle: 'bold', extraSpacing: 0 });

      doc.save(`${letterData.candidateName || 'appointment-letter'}.pdf`);

      await addDoc(collection(db, 'appointmentLetters'), {
        ...letterData,
        generatedAt: new Date().toISOString(),
        generatedBy: currentUser?.uid || null,
        generatedByEmail: currentUser?.email || null
      });
      toast.success('Appointment letter downloaded');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Unable to download appointment letter');
    } finally {
      setSavingPdf(false);
    }
  };

  const readyToDownload =
    letterData.candidateName &&
    letterData.jobTitle &&
    letterData.appointmentDate &&
    letterData.appointmentTime &&
    letterData.venue;

  return (
    <Container className="mt-4">
      <h2 className="mb-3">Appointment Letter Generator</h2>
      <p className="text-muted mb-4">
        Generate appointment letters for employees and export them as high-quality PDFs.
      </p>
      <Row>
        <Col lg={5} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Appointment Details</Card.Title>
              {loadingEmployees ? (
                <div className="d-flex align-items-center gap-2 mt-3">
                  <Spinner size="sm" />
                  <span>Loading employees...</span>
                </div>
              ) : (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Employee</Form.Label>
                    <Form.Select value={letterData.employeeId} onChange={handleEmployeeSelect}>
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
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Job Title *</Form.Label>
                        <Form.Control
                          type="text"
                          name="jobTitle"
                          value={letterData.jobTitle}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Department</Form.Label>
                        <Form.Control
                          type="text"
                          name="department"
                          value={letterData.department}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Appointment Date *</Form.Label>
                        <Form.Control
                          type="date"
                          name="appointmentDate"
                          value={letterData.appointmentDate}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Appointment Time *</Form.Label>
                        <Form.Control
                          type="text"
                          name="appointmentTime"
                          placeholder="10:00 AM"
                          value={letterData.appointmentTime}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Venue *</Form.Label>
                    <Form.Control
                      type="text"
                      name="venue"
                      value={letterData.venue}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Reporting To</Form.Label>
                    <Form.Control
                      type="text"
                      name="reportTo"
                      value={letterData.reportTo}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Person</Form.Label>
                        <Form.Control
                          type="text"
                          name="contactPerson"
                          value={letterData.contactPerson}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="contactEmail"
                          value={letterData.contactEmail}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Contact Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      name="contactPhone"
                      value={letterData.contactPhone}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Documents Required</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="documents"
                      value={letterData.documents}
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
                  <Form.Group className="mb-3">
                    <Form.Label>Issue Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="issueDate"
                      value={letterData.issueDate}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  {!readyToDownload && (
                    <Alert variant="info">
                      Fill in candidate name, job title, appointment date/time, and venue to enable
                      PDF download.
                    </Alert>
                  )}
                  <Button variant="primary" className="w-100" onClick={downloadPdf} disabled={!readyToDownload || savingPdf}>
                    {savingPdf ? 'Preparing...' : 'Download Appointment Letter'}
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={7}>
          <Card>
            <Card.Body ref={letterRef}>
              <Card.Title>Letter Preview</Card.Title>
              <div
                className="offer-letter-preview"
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '32px',
                  marginTop: '20px',
                  boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)'
                }}
              >
                <header style={{ marginBottom: '25px' }}>
                  <h3 style={{ marginBottom: '4px' }}>Soft Verse</h3>
                  <p style={{ color: '#64748b', margin: 0 }}>Appointment Letter</p>
                </header>
                <p style={{ color: '#475569' }}>{letterData.venue || 'Soft Verse HQ'}</p>
                <p style={{ color: '#475569' }}>{formatDisplayDate(letterData.issueDate)}</p>
                <p>Dear {letterData.candidateName || 'Candidate'},</p>
                <p>
                  This letter confirms your appointment for the role of{' '}
                  <strong>{letterData.jobTitle || 'Job Title'}</strong> with our{' '}
                  {letterData.department || 'team'}. Please review the details below and let us know
                  if you have any questions.
                </p>
                <ul style={{ paddingLeft: '20px' }}>
                  {[
                    { label: 'Date', value: formatDisplayDate(letterData.appointmentDate) },
                    { label: 'Time', value: letterData.appointmentTime || '__________' },
                    { label: 'Venue', value: letterData.venue || '__________' },
                    { label: 'Reporting to', value: letterData.reportTo || '__________' },
                    { label: 'Contact person', value: letterData.contactPerson || '__________' },
                    { label: 'Contact email', value: letterData.contactEmail || '__________' },
                    { label: 'Contact phone', value: letterData.contactPhone || '__________' }
                  ].map(({ label, value }) => (
                    <li key={label} style={{ marginBottom: '4px' }}>
                      <strong>{label}:</strong> {value}
                    </li>
                  ))}
                </ul>
                <p>
                  Please bring the following documents: {letterData.documents || 'listed documents'}.
                </p>
                <p>{letterData.notes}</p>
                <p style={{ marginTop: '30px' }}>
                  Sincerely,
                  <br />
                  <strong>People Operations</strong>
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

export default AppointmentLetterGenerator;


