import React, { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, Container, Modal, Spinner, Table } from 'react-bootstrap';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { db } from '../../firebase/config';
import { toast } from '../../utils/toast';

const VisitingCardRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const downloadRef = useRef(null);
  const [downloadJob, setDownloadJob] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, 'visitingCardHistory'), orderBy('generatedAt', 'desc'))
        );
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecords(list);
      } catch (error) {
        console.error('Failed to load card history:', error);
        toast.error('Unable to load card history');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const getPreviewStyle = (record) => ({
    width: '100%',
    maxWidth: '420px',
    margin: '0 auto',
    minHeight: '260px',
    position: 'relative',
    borderRadius: '18px',
    overflow: 'hidden',
    background: record?.backgroundColor || '#111827',
    padding: '20px',
    color: record?.textColor || '#ffffff'
  });

  useEffect(() => {
    const generateDownload = async () => {
      if (!downloadJob || !downloadRef.current) return;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      try {
        const canvas = await html2canvas(downloadRef.current, { backgroundColor: null, scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        if (downloadJob.type === 'png') {
          const link = document.createElement('a');
          link.download = `${downloadJob.record.name || 'visiting_card'}.png`;
          link.href = imgData;
          link.click();
        } else {
          const pdf = new jsPDF('landscape', 'mm', [89, 51]);
          const imgWidth = 89;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save(`${downloadJob.record.name || 'visiting_card'}.pdf`);
        }
        toast.success(`Card ${downloadJob.type.toUpperCase()} downloaded`);
      } catch (error) {
        console.error('Failed to download card:', error);
        toast.error('Unable to download card');
      } finally {
        setDownloadJob(null);
      }
    };
    generateDownload();
  }, [downloadJob]);

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-0">Visiting Card Records</h2>
          <p className="text-muted mb-0">History of every generated/saved visiting card.</p>
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
              <p className="mb-0 text-muted">No visiting cards have been generated yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Template</th>
                    <th>Generated At</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="fw-semibold">{record.name || 'N/A'}</div>
                        <div className="text-muted small">{record.company || '—'}</div>
                      </td>
                      <td>{record.designation || 'N/A'}</td>
                      <td>{record.phone || 'N/A'}</td>
                      <td>
                        {record.email ? <Badge bg="secondary">{record.email}</Badge> : 'N/A'}
                      </td>
                      <td>{record.templateName || record.templateId || 'Default'}</td>
                      <td>{formatDate(record.generatedAt)}</td>
                      <td className="text-end d-flex gap-2 justify-content-end">
                        <Button variant="outline-secondary" size="sm" onClick={() => handleView(record)}>
                          View Details
                        </Button>
                        <Button variant="outline-success" size="sm" onClick={() => setDownloadJob({ record, type: 'png' })}>
                          PNG
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => setDownloadJob({ record, type: 'pdf' })}>
                          PDF
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
          <Modal.Title>Card Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <div className="row">
              {[
                ['Name', selectedRecord.name],
                ['Title', selectedRecord.title],
                ['Designation', selectedRecord.designation],
                ['Company', selectedRecord.company],
                ['Phone', selectedRecord.phone],
                ['Email', selectedRecord.email],
                ['Website', selectedRecord.website],
                ['Address', selectedRecord.address],
                ['Template', selectedRecord.templateName || selectedRecord.templateId || 'Default'],
                ['Generated By', selectedRecord.generatedByEmail || 'N/A'],
                ['Generated At', formatDate(selectedRecord.generatedAt)]
              ].map(([label, value]) => (
                <div className="col-md-6 mb-3" key={label}>
                  <strong>{label}</strong>
                  <p className="mb-0">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
          {selectedRecord && (
            <div className="mt-4">
              <p className="fw-semibold">Printable Preview</p>
              <div style={getPreviewStyle(selectedRecord)}>
                <h4 style={{ marginBottom: '8px', color: selectedRecord.nameColor || selectedRecord.textColor }}>
                  {selectedRecord.name}
                </h4>
                <p style={{ marginBottom: '6px', color: selectedRecord.designationColor || selectedRecord.textColor }}>
                  {selectedRecord.designation}
                </p>
                {selectedRecord.title && (
                  <p style={{ marginBottom: '6px', color: selectedRecord.titleColor || selectedRecord.textColor }}>
                    {selectedRecord.title}
                  </p>
                )}
                <p style={{ fontWeight: 'bold', color: selectedRecord.companyColor || selectedRecord.textColor }}>
                  {selectedRecord.company}
                </p>
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                  {selectedRecord.phone && (
                    <p style={{ margin: '3px 0', color: selectedRecord.phoneColor || selectedRecord.textColor }}>
                      📞 {selectedRecord.phone}
                    </p>
                  )}
                  {selectedRecord.email && (
                    <p style={{ margin: '3px 0', color: selectedRecord.emailColor || selectedRecord.textColor }}>
                      ✉️ {selectedRecord.email}
                    </p>
                  )}
                  {selectedRecord.website && (
                    <p style={{ margin: '3px 0', color: selectedRecord.websiteColor || selectedRecord.textColor }}>
                      🌐 {selectedRecord.website}
                    </p>
                  )}
                  {selectedRecord.address && (
                    <p style={{ margin: '3px 0', color: selectedRecord.addressColor || selectedRecord.textColor }}>
                      📍 {selectedRecord.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {downloadJob && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={downloadRef} style={getPreviewStyle(downloadJob.record)}>
            <h4 style={{ marginBottom: '8px', color: downloadJob.record.nameColor || downloadJob.record.textColor }}>
              {downloadJob.record.name}
            </h4>
            <p style={{ marginBottom: '6px', color: downloadJob.record.designationColor || downloadJob.record.textColor }}>
              {downloadJob.record.designation}
            </p>
            {downloadJob.record.title && (
              <p style={{ marginBottom: '6px', color: downloadJob.record.titleColor || downloadJob.record.textColor }}>
                {downloadJob.record.title}
              </p>
            )}
            <p style={{ fontWeight: 'bold', color: downloadJob.record.companyColor || downloadJob.record.textColor }}>
              {downloadJob.record.company}
            </p>
            <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
              {downloadJob.record.phone && (
                <p style={{ margin: '3px 0', color: downloadJob.record.phoneColor || downloadJob.record.textColor }}>📞 {downloadJob.record.phone}</p>
              )}
              {downloadJob.record.email && (
                <p style={{ margin: '3px 0', color: downloadJob.record.emailColor || downloadJob.record.textColor }}>✉️ {downloadJob.record.email}</p>
              )}
              {downloadJob.record.website && (
                <p style={{ margin: '3px 0', color: downloadJob.record.websiteColor || downloadJob.record.textColor }}>🌐 {downloadJob.record.website}</p>
              )}
              {downloadJob.record.address && (
                <p style={{ margin: '3px 0', color: downloadJob.record.addressColor || downloadJob.record.textColor }}>📍 {downloadJob.record.address}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default VisitingCardRecords;


