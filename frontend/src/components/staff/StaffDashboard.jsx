import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI, clinicAPI, doctorAPI, queueAPI } from '../../services/api';
import { useToast } from '../../context/useToast';

export default function StaffDashboard({ clinicId, staffProfileId, doctorProfileId }) {
  const { show } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [queueEntries, setQueueEntries] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walkInPatientId, setWalkInPatientId] = useState('');
  const [walkInDoctorId, setWalkInDoctorId] = useState('');
  const [walkInSelectedDate, setWalkInSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [walkInTimeSlots, setWalkInTimeSlots] = useState([]);
  const [walkInSelectedSlot, setWalkInSelectedSlot] = useState('');
  const [walkInSlotsLoading, setWalkInSlotsLoading] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState('');
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  // filters for appointments list
  const [filterClinic, setFilterClinic] = useState(String(clinicId || ''));
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const isStaff = Boolean(staffProfileId);
  const isDoctor = Boolean(doctorProfileId) && !isStaff;

  useEffect(() => {
    const loadData = async () => {
      if (!clinicId) {
        return;
      }
      setLoading(true);
      try {
        if (isStaff) {
          const [appointmentRes, queueRes, reportRes, entriesRes, doctorRes, clinicRes] =
            await Promise.all([
              appointmentAPI.listForClinic(clinicId),
              queueAPI.staffQueueStatus(clinicId),
              queueAPI.staffDailyReport(clinicId),
              queueAPI.staffQueueEntries(clinicId),
              doctorAPI.getAll(),
              clinicAPI.getAll(),
            ]);
          setAppointments(appointmentRes.data || []);
          setQueueStatus(queueRes.data || null);
          setDailyReport(reportRes.data || null);
          setQueueEntries(entriesRes.data || []);
          setDoctors((doctorRes.data || []).filter((doctor) => doctor.clinicId === clinicId));
          setClinics(clinicRes.data || []);
          // initialize clinic filter to the assigned clinic
          setFilterClinic(String(clinicId || ''));
        } else if (isDoctor && doctorProfileId) {
          const [appointmentRes, queueRes] = await Promise.all([
            appointmentAPI.listForDoctor(doctorProfileId),
            queueAPI.staffQueueStatus(clinicId),
          ]);
          setAppointments(appointmentRes.data || []);
          setQueueStatus(queueRes.data || null);
        }
      } catch (error) {
        show(error?.userMessage || 'Failed to load staff dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clinicId, doctorProfileId, isDoctor, isStaff, show]);

  const refreshAppointments = async () => {
    try {
      if (isStaff) {
        const res = await appointmentAPI.listForClinic(clinicId);
        setAppointments(res.data || []);
      } else if (isDoctor && doctorProfileId) {
        const res = await appointmentAPI.listForDoctor(doctorProfileId);
        setAppointments(res.data || []);
      }
    } catch (error) {
      show(error?.userMessage || 'Unable to refresh appointments.', 'error');
    }
  };

  const refreshQueueStatus = async () => {
    try {
      const res = await queueAPI.staffQueueStatus(clinicId);
      setQueueStatus(res.data || null);
    } catch (error) {
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to refresh queue status.',
        'error'
      );
    }
  };

  const refreshQueueEntries = async () => {
    if (!isStaff) {
      return;
    }
    try {
      const res = await queueAPI.staffQueueEntries(clinicId);
      setQueueEntries(res.data || []);
    } catch (error) {
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to refresh queue entries.',
        'error'
      );
    }
  };

  const handleQueueAction = async (action) => {
    try {
      if (action === 'start') await queueAPI.staffStart(clinicId);
      if (action === 'pause') await queueAPI.staffPause(clinicId);
      if (action === 'next') await queueAPI.staffNext(clinicId);
      show('Queue updated successfully.', 'success');
      refreshQueueStatus();
      refreshQueueEntries();
      refreshAppointments();
    } catch (error) {
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to update queue.',
        'error'
      );
    }
  };

  const handleQueueStatusUpdate = async (queueNumber, status) => {
    try {
      await queueAPI.staffMarkStatus(queueNumber, { clinicId, status });
      show('Queue status updated.', 'success');
      refreshQueueStatus();
      refreshQueueEntries();
      refreshAppointments();
    } catch (error) {
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to update queue status.',
        'error'
      );
    }
  };

  const handleFastTrack = async (queueNumber) => {
    try {
      await queueAPI.staffFastTrack(clinicId, queueNumber);
      show('Patient fast-tracked.', 'success');
      refreshQueueEntries();
      refreshQueueStatus();
    } catch (error) {
      show(error?.userMessage || error.response?.data?.message || 'Unable to fast-track.', 'error');
    }
  };

  const handleWalkInSubmit = async (event) => {
    event.preventDefault();
    if (!walkInPatientId || !walkInDoctorId || !walkInSelectedDate || !walkInSelectedSlot) {
      show('Please provide patient, doctor, and appointment time.', 'error');
      return;
    }
    try {
      const combined = new Date(`${walkInSelectedDate}T${walkInSelectedSlot}:00`);
      const iso = combined.toISOString();
      await appointmentAPI.staffWalkIn({
        patientId: Number(walkInPatientId),
        doctorId: Number(walkInDoctorId),
        clinicId,
        dateTime: iso,
      });
      show('Walk-in appointment created.', 'success');
      setWalkInPatientId('');
      setWalkInDoctorId('');
      setWalkInSelectedDate(new Date().toISOString().slice(0, 10));
      setWalkInSelectedSlot('');
      refreshAppointments();
    } catch (error) {
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to register walk-in.',
        'error'
      );
    }
  };

  const handleStaffCancel = async (appointmentId) => {
    try {
      await appointmentAPI.staffCancel(appointmentId);
      show('Appointment cancelled.', 'success');
      refreshAppointments();
    } catch (error) {
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to cancel appointment.',
        'error'
      );
    }
  };

  const startReschedule = (appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleDoctorId(appointment.doctorId ? String(appointment.doctorId) : '');
    setRescheduleDateTime(toLocalInputValue(appointment.dateTime));
  };

  const cancelRescheduleForm = () => {
    setRescheduleTarget(null);
    setRescheduleDoctorId('');
    setRescheduleDateTime('');
  };

  const handleRescheduleSubmit = async (event) => {
    event.preventDefault();
    if (!rescheduleTarget || !rescheduleDoctorId || !rescheduleDateTime) {
      show('Please choose the new doctor and timeslot.', 'error');
      return;
    }
    try {
      await appointmentAPI.staffReschedule(rescheduleTarget.id, {
        clinicId,
        doctorId: Number(rescheduleDoctorId),
        dateTime: rescheduleDateTime,
      });
      show('Appointment rescheduled.', 'success');
      cancelRescheduleForm();
      refreshAppointments();
    } catch (error) {
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to reschedule appointment.',
        'error'
      );
    }
  };

  const toLocalInputValue = (value) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const adjusted = new Date(date.getTime() - offset * 60000);
    return adjusted.toISOString().slice(0, 16);
  };

  const clinicDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.clinicId === clinicId),
    [clinicId, doctors]
  );

  const availableDoctorsForFilter = useMemo(() => {
    if (!filterClinic) return doctors;
    return doctors.filter((d) => d.clinicId === Number(filterClinic));
  }, [doctors, filterClinic]);

  const filteredAppointments = useMemo(() => {
    let list = appointments || [];
    if (filterClinic) {
      list = list.filter((a) => Number(a.clinicId) === Number(filterClinic));
    }
    if (filterDoctor) {
      list = list.filter((a) => Number(a.doctorId) === Number(filterDoctor));
    }
    if (filterDate) {
      list = list.filter((a) => {
        const d = new Date(a.dateTime).toISOString().slice(0, 10);
        return d === filterDate;
      });
    }
    return list;
  }, [appointments, filterClinic, filterDoctor, filterDate]);

  // load walk-in slots when doctor or date changes
  useEffect(() => {
    const loadWalkInSlots = async () => {
      if (!clinicId || !walkInDoctorId || !walkInSelectedDate) {
        setWalkInTimeSlots([]);
        return;
      }
      setWalkInSlotsLoading(true);
      try {
        const scheduleRes = await doctorAPI.getSchedule(Number(walkInDoctorId));
        const slotInterval = scheduleRes.data?.slotIntervalMinutes || 15;

        const apptRes = await appointmentAPI.listForClinic(clinicId, walkInSelectedDate);
        const occupied = (apptRes.data || []).map((a) => toLocalInputValue(a.dateTime));

        const openTime = '09:00:00';
        const closeTime = '17:00:00';

        const parseTime = (t) => {
          const parts = t.split(':');
          return { hh: Number(parts[0]), mm: Number(parts[1]) };
        };

        const open = parseTime(openTime);
        const close = parseTime(closeTime);

        const slots = [];
        const start = new Date(
          `${walkInSelectedDate}T${String(open.hh).padStart(2, '0')}:${String(open.mm).padStart(
            2,
            '0'
          )}:00`
        );
        const end = new Date(
          `${walkInSelectedDate}T${String(close.hh).padStart(2, '0')}:${String(close.mm).padStart(
            2,
            '0'
          )}:00`
        );
        for (let d = new Date(start); d < end; d.setMinutes(d.getMinutes() + slotInterval)) {
          const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          const timeOnly = isoLocal.slice(11, 16);
          if (!occupied.includes(isoLocal)) {
            slots.push(timeOnly);
          }
        }
        setWalkInTimeSlots(slots);
        if (!slots.includes(walkInSelectedSlot)) setWalkInSelectedSlot('');
      } catch {
        setWalkInTimeSlots([]);
      } finally {
        setWalkInSlotsLoading(false);
      }
    };
    loadWalkInSlots();
  }, [clinicId, walkInDoctorId, walkInSelectedDate, walkInSelectedSlot]);

  if (!clinicId) {
    return <p>Please contact the administrator to assign you to a clinic.</p>;
  }

  if (loading) {
    return <p>Loading staff dashboard...</p>;
  }

  return (
    <div>
      <h2 className="section-title">{isStaff ? 'Clinic Operations' : 'Clinic Schedule'}</h2>
      {isDoctor && (
        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <Link to="/doctor/notes" className="btn btn-primary">
            Notes Editor
          </Link>
        </div>
      )}

      {isStaff && (
        <div className="grid">
          <div className="card">
            <h3>Queue Controls</h3>
            <div className="actions">
              <button className="btn btn-success" onClick={() => handleQueueAction('start')}>
                Start Queue
              </button>
              <button className="btn btn-warning" onClick={() => handleQueueAction('pause')}>
                Pause Queue
              </button>
              <button className="btn btn-secondary" onClick={() => handleQueueAction('next')}>
                Call Next
              </button>
            </div>
            <div style={{ marginTop: 16 }}>
              <p>
                <strong>Current Number:</strong> {queueStatus?.currentNumber ?? '-'}
              </p>
              <p>
                <strong>Waiting Patients:</strong> {queueStatus?.waitingCount ?? 0}
              </p>
              <p>
                <strong>Queue State:</strong> {queueStatus?.state ?? 'UNKNOWN'}
              </p>
              <div className="actions">
                <button className="btn btn-secondary" onClick={refreshQueueStatus}>
                  Refresh Status
                </button>
                <button className="btn btn-secondary" onClick={refreshQueueEntries}>
                  Refresh Queue
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Queue Entries</h3>
            {queueEntries.length === 0 ? (
              <p style={{ color: '#666' }}>No patients have checked in yet.</p>
            ) : (
              <div className="list">
                {queueEntries.map((entry) => (
                  <div key={entry.queueNumber} className="list-item">
                    <div>
                      <strong>Queue #{entry.queueNumber}</strong>
                      <div>Status: {entry.status}</div>
                      {entry.patientId && <div>Patient #{entry.patientId}</div>}
                      {entry.doctorId && <div>Doctor #{entry.doctorId}</div>}
                    </div>
                    <div className="actions">
                      {entry.status === 'WAITING' && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleFastTrack(entry.queueNumber)}
                        >
                          Fast Track
                        </button>
                      )}
                      {['WAITING', 'FAST_TRACKED', 'CALLED'].includes(entry.status) && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleQueueStatusUpdate(entry.queueNumber, 'CANCELLED')}
                        >
                          Cancel
                        </button>
                      )}
                      {entry.status === 'CALLED' && (
                        <>
                          <button
                            className="btn btn-success"
                            onClick={() => handleQueueStatusUpdate(entry.queueNumber, 'SERVED')}
                          >
                            Mark Served
                          </button>
                          <button
                            className="btn btn-warning"
                            onClick={() => handleQueueStatusUpdate(entry.queueNumber, 'SKIPPED')}
                          >
                            Mark No Show
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid">
        <div className="card">
          <h3>{isDoctor ? 'Your Appointments' : "Today's Appointments"}</h3>

          {/* Filters */}
          {isStaff && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select
                value={filterClinic}
                onChange={(e) => {
                  setFilterClinic(e.target.value);
                  setFilterDoctor('');
                }}
              >
                <option value="">All Clinics</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || `Clinic #${c.id}`}
                  </option>
                ))}
              </select>

              <select
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                disabled={!filterClinic}
              >
                <option value="">All Doctors</option>
                {availableDoctorsForFilter.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName || `Doctor #${d.id}`}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                placeholder="Date"
              />
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFilterClinic(String(clinicId || ''));
                  setFilterDoctor('');
                  setFilterDate('');
                }}
              >
                Reset
              </button>
            </div>
          )}

          {filteredAppointments.length === 0 ? (
            <p style={{ color: '#666' }}>No appointments scheduled.</p>
          ) : (
            <div className="list">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="list-item">
                  <div>
                    <strong>{new Date(appointment.dateTime).toLocaleString()}</strong>
                    <div>Patient #{appointment.patientId}</div>
                    {isStaff && <div>Doctor #{appointment.doctorId}</div>}
                    <div>Status: {appointment.status}</div>
                  </div>
                  {isStaff && (
                    <div className="actions">
                      <button
                        className="btn btn-warning"
                        onClick={() => startReschedule(appointment)}
                      >
                        Reschedule
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleStaffCancel(appointment.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isStaff && (
          <div className="card">
            <h3>Daily Report</h3>
            {dailyReport ? (
              <div className="report">
                <p>
                  <strong>Total Appointments:</strong> {dailyReport.totalAppointments}
                </p>
                <p>
                  <strong>Completed:</strong> {dailyReport.completedAppointments}
                </p>
                <p>
                  <strong>Cancelled:</strong> {dailyReport.cancelledAppointments}
                </p>
                <p>
                  <strong>No Shows:</strong> {dailyReport.noShowAppointments}
                </p>
                <p>
                  <strong>Patients Served:</strong> {dailyReport.patientsServed}
                </p>
                <p>
                  <strong>Waiting:</strong> {dailyReport.patientsWaiting}
                </p>
              </div>
            ) : (
              <p>No report data available yet.</p>
            )}
          </div>
        )}
      </div>

      {isStaff && (
        <div className="grid">
          <div className="card">
            <h3>Register Walk-in</h3>
            <form className="form" onSubmit={handleWalkInSubmit}>
              <div className="form-group">
                <label>Patient ID</label>
                <input
                  type="number"
                  min="1"
                  value={walkInPatientId}
                  onChange={(event) => setWalkInPatientId(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Doctor</label>
                <select
                  value={walkInDoctorId}
                  onChange={(event) => setWalkInDoctorId(event.target.value)}
                  required
                >
                  <option value="">Choose a doctor...</option>
                  {clinicDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.fullName || `Doctor #${doctor.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Appointment Date & Time</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="date"
                    value={walkInSelectedDate}
                    onChange={(event) => setWalkInSelectedDate(event.target.value)}
                    required
                  />
                  {walkInSlotsLoading ? (
                    <div>Loading slots...</div>
                  ) : (
                    <select
                      value={walkInSelectedSlot}
                      onChange={(e) => setWalkInSelectedSlot(e.target.value)}
                      required
                      disabled={!walkInSelectedDate}
                    >
                      <option value="">Choose a time...</option>
                      {walkInTimeSlots.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-success">
                Add Walk-in
              </button>
            </form>
          </div>

          {rescheduleTarget && (
            <div className="card">
              <h3>Reschedule Appointment #{rescheduleTarget.id}</h3>
              <form className="form" onSubmit={handleRescheduleSubmit}>
                <div className="form-group">
                  <label>Doctor</label>
                  <select
                    value={rescheduleDoctorId}
                    onChange={(event) => setRescheduleDoctorId(event.target.value)}
                    required
                  >
                    <option value="">Choose a doctor...</option>
                    {clinicDoctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.fullName || `Doctor #${doctor.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>New Timeslot</label>
                  <input
                    type="datetime-local"
                    value={rescheduleDateTime}
                    onChange={(event) => setRescheduleDateTime(event.target.value)}
                    required
                  />
                </div>

                <div className="actions">
                  <button type="submit" className="btn btn-success">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelRescheduleForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
