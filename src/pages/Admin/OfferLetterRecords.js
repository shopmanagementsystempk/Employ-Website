import React, { useEffect, useState } from 'react';
import { Button, Card, Container, Table, Spinner, Badge, Modal } from 'react-bootstrap';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from '../../utils/toast';
import jsPDF from 'jspdf';

const OfferLetterRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const companyLogo = `${process.env.PUBLIC_URL || ''}/logo.png`;

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, 'offerLetters'), orderBy('generatedAt', 'desc'))
        );
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecords(list);
      } catch (error) {
        console.error('Failed to load offer letters:', error);
        toast.error('Unable to load offer letter records');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await fetch(companyLogo);
        if (!res.ok) return;
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoDataUrl(reader.result);
        reader.readAsDataURL(blob);
      } catch (error) {
        console.warn('Unable to load logo for PDF:', error);
      }
    };
    loadLogo();
  }, [companyLogo]);

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const formatDisplayDate = (value) => {
    if (!value) return '__________';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadSummary = (record) => {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.candidateName || 'offer-letter'}-summary.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!selectedRecord) return;
    setDownloadingPdf(true);
    const data = selectedRecord;
    try {
      const normalizeLocation = (loc) => {
        const base = loc || 'Soft Verse';
        return base.replace(/\s*HQ\s*$/i, '').trim();
      };
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
        const logoSize = 20;
        const spacing = 6;
        const subtitleGap = 16;
        const blockHeight = Math.max(logoSize, 24);
        const titleBaseline = cursorY + blockHeight / 2;
        const textX = logoDataUrl ? marginX + logoSize + spacing : marginX;

        if (logoDataUrl) {
          const logoY = cursorY + (blockHeight - logoSize) / 2;
          doc.addImage(logoDataUrl, 'PNG', marginX, logoY, logoSize, logoSize);
        }

        doc.setFont('times', 'bold');
        doc.setFontSize(20);
        doc.text('Soft Verse', textX, titleBaseline, { baseline: 'middle' });
        doc.setFont('times', 'italic');
        doc.setFontSize(12);
        doc.text('Official Offer Letter', textX, titleBaseline + subtitleGap);

        cursorY += blockHeight + subtitleGap;

        doc.setFont('times', 'italic');
        doc.setFontSize(11);
        doc.text(normalizeLocation(data.location || 'Soft Verse'), marginX, cursorY);
        cursorY += 6;
        doc.text(formatDisplayDate(data.offerDate), marginX, cursorY);
        cursorY += 10;
      };

      addHeader();
      addParagraph(`Dear ${data.candidateName || 'Candidate'},`, { fontStyle: 'bold' });
      addParagraph(
        `We are delighted to extend to you the offer of ${
          data.jobTitle || 'Job Title'
        } within our ${data.department || 'team'} at Soft Verse. Your experience and passion impressed us, and we are confident you will have an immediate impact.`,
        { extraSpacing: 6 }
      );
      addParagraph('The key details of this offer are highlighted below:', {
        fontStyle: 'italic',
        extraSpacing: 3
      });

      addBullets([
        { label: 'Start date', value: formatDisplayDate(data.startDate) },
        { label: 'Salary', value: data.salary || '__________' },
        { label: 'Employment type', value: data.employmentType || '__________' },
        { label: 'Reporting to', value: data.reportingManager || '__________' },
        { label: 'Probation period', value: data.probationPeriod || '__________' }
      ]);

      addParagraph(
        `Your role will be based at ${normalizeLocation(data.location || 'Soft Verse')} and will include access to the following benefits:`
      );
      addParagraph(
        data.benefits ||
          'Comprehensive health insurance, annual leave, and a dedicated learning stipend.'
      );
      addParagraph(
        data.notes ||
          'Please sign and return this letter to confirm your acceptance. We are excited to welcome you to the team.'
      );
      addParagraph('Sincerely,', { extraSpacing: 2 });
      addParagraph('People Operations', { fontStyle: 'bold', extraSpacing: 2 });
      addParagraph('Soft Verse', { fontStyle: 'bold', extraSpacing: 0 });

      doc.save(`${data.candidateName || 'offer-letter'}-record.pdf`);
      toast.success('Offer letter PDF downloaded');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Unable to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-0">Offer Letter Records</h2>
          <p className="text-muted mb-0">Audit log of every generated offer letter.</p>
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
              <p className="mb-0 text-muted">No offer letters generated yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Job Title</th>
                    <th>Salary</th>
                    <th>Start Date</th>
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
                      <td>{record.salary || 'N/A'}</td>
                      <td>{record.startDate ? new Date(record.startDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        {record.generatedByEmail ? (
                          <Badge bg="secondary">{record.generatedByEmail}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>{formatDate(record.generatedAt)}</td>
                      <td className="text-end d-flex gap-2 justify-content-end">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowModal(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => downloadSummary(record)}
                        >
                          Download Summary
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

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Offer Letter Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <strong>Candidate Name</strong>
                <p className="mb-0">{selectedRecord.candidateName || 'N/A'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Job Title</strong>
                <p className="mb-0">{selectedRecord.jobTitle || 'N/A'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Salary</strong>
                <p className="mb-0">{selectedRecord.salary || 'N/A'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Start Date</strong>
                <p className="mb-0">
                  {selectedRecord.startDate
                    ? new Date(selectedRecord.startDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Department</strong>
                <p className="mb-0">{selectedRecord.department || 'N/A'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Employment Type</strong>
                <p className="mb-0">{selectedRecord.employmentType || 'N/A'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Reporting Manager</strong>
                <p className="mb-0">{selectedRecord.reportingManager || 'N/A'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Probation Period</strong>
                <p className="mb-0">{selectedRecord.probationPeriod || 'N/A'}</p>
              </div>
              <div className="col-12 mb-3">
                <strong>Benefits</strong>
                <p className="mb-0">{selectedRecord.benefits || 'N/A'}</p>
              </div>
              <div className="col-12 mb-3">
                <strong>Additional Notes</strong>
                <p className="mb-0">{selectedRecord.notes || 'N/A'}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleDownloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? 'Preparing...' : 'Download PDF'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OfferLetterRecords;


