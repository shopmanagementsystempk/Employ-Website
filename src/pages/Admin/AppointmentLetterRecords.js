import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Container, Modal, Spinner, Table } from 'react-bootstrap';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import jsPDF from 'jspdf';
import { db } from '../../firebase/config';
import { toast } from '../../utils/toast';

const AppointmentLetterRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, 'appointmentLetters'), orderBy('generatedAt', 'desc'))
        );
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecords(list);
      } catch (error) {
        console.error('Failed to load appointment letter records:', error);
        toast.error('Unable to load appointment letter records');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const formatDisplayDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const downloadPdf = async (record) => {
    setDownloadingId(record.id);
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

      const formatDate = (value) => {
        if (!value) return '____________';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };

      addHeader();
      addParagraph(record.venue || 'Soft Verse HQ', { fontStyle: 'italic', extraSpacing: 2 });
      addParagraph(formatDate(record.issueDate), { fontStyle: 'italic', extraSpacing: 8 });
      addParagraph(`Dear ${record.candidateName || 'Candidate'},`, { fontStyle: 'bold' });
      addParagraph(
        `This letter confirms your appointment for the position of ${
          record.jobTitle || '__________'
        } with our ${record.department || '__________'} team.`
      );
      addParagraph('Appointment details:', { fontStyle: 'italic', extraSpacing: 3 });

      const detailItems = [
        { label: 'Appointment Date', value: formatDate(record.appointmentDate) },
        { label: 'Appointment Time', value: record.appointmentTime || '__________' },
        { label: 'Venue', value: record.venue || '__________' },
        { label: 'Reporting To', value: record.reportTo || '__________' },
        { label: 'Contact Person', value: record.contactPerson || '__________' },
        { label: 'Contact Email', value: record.contactEmail || '__________' },
        { label: 'Contact Phone', value: record.contactPhone || '__________' }
      ];

      const addDetailList = (items) => {
        doc.setFontSize(11);
        items.forEach(({ label, value }) => {
          ensureSpace(8);
          doc.text('•', marginX, cursorY);
          const startX = marginX + 6;
          const labelText = `${label}:`;
          doc.setFont('times', 'bold');
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
        `Please bring the following documents: ${record.documents || '__________'}.`
      );
      addParagraph(
        record.notes ||
          'Please arrive 15 minutes prior to the appointment time for check-in procedures.'
      );
      addParagraph('We look forward to meeting you.');
      addParagraph('Sincerely,', { extraSpacing: 2 });
      addParagraph('People Operations', { fontStyle: 'bold', extraSpacing: 2 });
      addParagraph('Soft Verse', { fontStyle: 'bold', extraSpacing: 0 });

      doc.save(`${record.candidateName || 'appointment-letter'}.pdf`);
      toast.success('Appointment letter downloaded');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('Unable to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-0">Appointment Letter Records</h2>
          <p className="text-muted mb-0">Audit log of generated appointment letters.</p>
        </div>
      </div>
      <Card>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-5">
              <p className="mb-0 text-muted">No appointment letters generated yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Position</th>
                    <th>Appointment</th>
                    <th>Contact</th>
                    <th>Generated By</th>
                    <th>Generated At</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="fw-semibold">{record.candidateName || 'N/A'}</div>
                        <div className="text-muted small">{record.department || '—'}</div>
                      </td>
                      <td>{record.jobTitle || 'N/A'}</td>
                      <td>
                        {formatDisplayDate(record.appointmentDate)}
                        <div className="text-muted small">{record.appointmentTime || ''}</div>
                      </td>
                      <td>{record.contactEmail || record.contactPhone || 'N/A'}</td>
                      <td>
                        {record.generatedByEmail ? (
                          <Badge bg="secondary">{record.generatedByEmail}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>{formatDisplayDate(record.generatedAt)}</td>
                      <td className="text-end d-flex gap-2 justify-content-end">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => downloadPdf(record)}
                          disabled={downloadingId === record.id}
                        >
                          {downloadingId === record.id ? 'Preparing...' : 'Download PDF'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={Boolean(selectedRecord)} onHide={() => setSelectedRecord(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Appointment Letter Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <div className="row">
              {[
                ['Candidate', selectedRecord.candidateName],
                ['Job Title', selectedRecord.jobTitle],
                ['Department', selectedRecord.department],
                ['Appointment Date', formatDisplayDate(selectedRecord.appointmentDate)],
                ['Appointment Time', selectedRecord.appointmentTime],
                ['Venue', selectedRecord.venue],
                ['Reporting To', selectedRecord.reportTo],
                ['Contact Person', selectedRecord.contactPerson],
                ['Contact Email', selectedRecord.contactEmail],
                ['Contact Phone', selectedRecord.contactPhone],
                ['Documents', selectedRecord.documents],
                ['Notes', selectedRecord.notes],
                ['Generated By', selectedRecord.generatedByEmail],
                ['Generated At', formatDisplayDate(selectedRecord.generatedAt)]
              ].map(([label, value]) => (
                <div className="col-md-6 mb-3" key={label}>
                  <strong>{label}</strong>
                  <p className="mb-0">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedRecord(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AppointmentLetterRecords;


