import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { patientAPI } from '../services/api';
import { useToast } from '../context/useToast';

export default function MedicalRecordDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { show } = useToast();
  const [record, setRecord] = useState(location.state?.record || null);
  const [loading, setLoading] = useState(!record);

  useEffect(() => {
    // If we navigated with record in state, no need to fetch.
    if (record) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const statePatientId = location.state?.patientId;
        if (statePatientId) {
          // Use the single-record API when we have the patientId
          const res = await patientAPI.getMedicalRecord(statePatientId, id);
          setRecord(res.data || null);
          return;
        }

        // If we don't have a patientId in state, attempt to fetch the record directly using record id
        // but the API requires patientId, so fall back to fetching the full list for patient 0 and searching
        const listRes = await patientAPI.medicalRecords(location.state?.patientId || 0);
        const found = (listRes.data || []).find((r) => String(r.id) === String(id));
        setRecord(found || null);
      } catch (err) {
        show(err?.userMessage || 'Unable to load medical record.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, location.state, show, record]);

  if (loading) return <p>Loading medical record...</p>;
  if (!record)
    return (
      <div>
        <p>Medical record not found.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    );

  return (
    <div>
      <h2>Medical Record Detail</h2>
      <div className="card">
        <p>
          <strong>Date:</strong>{' '}
          {record.recordDate ? new Date(record.recordDate).toLocaleString() : 'N/A'}
        </p>
        {record.clinicName && (
          <p>
            <strong>Clinic:</strong> {record.clinicName}
          </p>
        )}
        {record.doctorName && (
          <p>
            <strong>Doctor:</strong> {record.doctorName}
          </p>
        )}
        {record.diagnosis && (
          <p>
            <strong>Diagnosis:</strong> {record.diagnosis}
          </p>
        )}
        {record.treatment && (
          <p>
            <strong>Treatment:</strong> {record.treatment}
          </p>
        )}
        {record.notes && (
          <div>
            <h4>Doctor's Notes</h4>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{record.notes}</pre>
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <Link to="/dashboard" className="btn btn-secondary">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
