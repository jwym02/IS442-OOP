import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appointmentAPI, doctorAPI, patientAPI } from '../services/api';
import { useToast } from '../context/useToast';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';
import { useAuth } from '../context/useAuth';

export default function DoctorNotes() {
  const { show } = useToast();
  const { user } = useContext(AuthContext);
  const doctorId = user?.doctorProfileId;
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [originalNotes, setOriginalNotes] = useState('');
  const [filterPatientId, setFilterPatientId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!doctorId) {
        setAppointments([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await appointmentAPI.listForDoctor(doctorId);
        // Filter to in-progress or completed (common status names)
        const filtered = (res.data || []).filter((a) =>
          ['IN_PROGRESS', 'COMPLETED', 'SERVED', 'CALLED'].includes(String(a.status).toUpperCase())
        );
        setAppointments(filtered);
      } catch (err) {
        show(err?.userMessage || 'Unable to load appointments.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId, show]);

  const startEdit = (appt) => {
    setSelected(appt);
    setNotes('');
    setOriginalNotes('');
  };

  // when selected appointment changes, try to preload existing notes for that appointment
  useEffect(() => {
    const loadExistingNotes = async () => {
      if (!selected) return;
      try {
        const res = await patientAPI.medicalRecords(selected.patientId);
        const found = (res.data || []).find((r) => Number(r.appointmentId) === Number(selected.id));
        if (found) {
          setNotes(found.notes || '');
          setOriginalNotes(found.notes || '');
        } else {
          setNotes('');
          setOriginalNotes('');
        }
      } catch {
        // non-fatal: just leave notes empty
      }
    };
    loadExistingNotes();
  }, [selected]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return show('Select an appointment first', 'error');
    setSubmitting(true);
    try {
      await doctorAPI.postNotes(doctorId, {
        doctorId: Number(doctorId),
        appointmentId: Number(selected.id),
        notes,
      });
      show('Notes saved.', 'success');
      setSelected(null);
      setNotes('');
      // refresh list
      const res = await appointmentAPI.listForDoctor(doctorId);
      setAppointments(
        (res.data || []).filter((a) =>
          ['IN_PROGRESS', 'COMPLETED', 'SERVED', 'CALLED'].includes(String(a.status).toUpperCase())
        )
      );
    } catch (err) {
      show(err?.userMessage || 'Unable to save notes.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!doctorId) {
    return <p>Please login as a doctor to access this page.</p>;
  }

  return (
    <div>
      <header
        className="dashboard-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1>SingHealth Clinic System</h1>
        <div className="user-info">
          <span>{doctorId ? `DOCTOR #${doctorId}` : ''}</span>
          <button onClick={logout} className="btn-secondary" style={{ marginLeft: 8 }}>
            Logout
          </button>
        </div>
      </header>
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
      <div className="grid">
        <div className="card">
          <h3>Your Appointments (editable)</h3>
          <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              placeholder="Filter by patient id"
              value={filterPatientId}
              onChange={(e) => setFilterPatientId(e.target.value)}
              style={{ width: 140 }}
            />
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            <button
              className="btn btn-secondary"
              onClick={() => {
                // simple local filter refresh
                (async () => {
                  setLoading(true);
                  try {
                    const res = await appointmentAPI.listForDoctor(doctorId);
                    const filtered = (res.data || []).filter((a) =>
                      ['IN_PROGRESS', 'COMPLETED', 'SERVED', 'CALLED'].includes(
                        String(a.status).toUpperCase()
                      )
                    );
                    setAppointments(filtered);
                  } catch {
                    // ignore
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : appointments.length === 0 ? (
            <p style={{ color: '#666' }}>No appointments available for notes.</p>
          ) : (
            <div className="list">
              {appointments
                .filter((a) => {
                  if (filterPatientId && String(a.patientId) !== String(filterPatientId))
                    return false;
                  if (filterDate) {
                    const d = new Date(a.dateTime).toISOString().slice(0, 10);
                    if (d !== filterDate) return false;
                  }
                  return true;
                })
                .map((a) => (
                  <div key={a.id} className="list-item">
                    <div>
                      <strong>{new Date(a.dateTime).toLocaleString()}</strong>
                      <div>Patient #{a.patientId}</div>
                      <div>Status: {a.status}</div>
                    </div>
                    <div className="actions">
                      <button className="btn btn-secondary" onClick={() => startEdit(a)}>
                        Add / Edit Notes
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Notes Editor</h3>
          {selected ? (
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Appointment</label>
                <div>
                  {selected.id} — {new Date(selected.dateTime).toLocaleString()}
                </div>
                <div>Patient #{selected.patientId}</div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} />
                <div style={{ marginTop: 6, color: '#666' }}>{notes.length} characters</div>
                {originalNotes && originalNotes !== notes && (
                  <div style={{ marginTop: 6, color: '#666' }}>
                    <strong>Original:</strong> {originalNotes.slice(0, 200)}
                    {originalNotes.length > 200 ? '...' : ''}
                  </div>
                )}
              </div>

              <div className="actions">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submitting || notes === originalNotes}
                >
                  {submitting ? 'Saving...' : notes === originalNotes ? 'No changes' : 'Save Notes'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelected(null);
                    setNotes('');
                    setOriginalNotes('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p style={{ color: '#666' }}>Select an appointment to add or edit notes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
