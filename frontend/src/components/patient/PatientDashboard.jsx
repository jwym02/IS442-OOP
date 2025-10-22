import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI, clinicAPI, doctorAPI, patientAPI, queueAPI } from '../../services/api';
import { useToast } from '../../context/useToast';

export default function PatientDashboard({ patientId, userName }) {
  const { show } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  // date/time input replaced by date + slot picker
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [checkedInAppointmentId, setCheckedInAppointmentId] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [medicalLoading, setMedicalLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleClinic, setRescheduleClinic] = useState('');
  const [rescheduleDoctor, setRescheduleDoctor] = useState('');
  const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState('');
  const [rescheduleTimeSlots, setRescheduleTimeSlots] = useState([]);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState('');
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [apptRes, clinicRes, doctorRes, recordsRes] = await Promise.all([
          appointmentAPI.listForPatient(patientId),
          clinicAPI.getAll(),
          doctorAPI.getAll(),
          patientAPI.medicalRecords(patientId),
        ]);
        setAppointments(apptRes.data || []);
        setClinics(clinicRes.data || []);
        setDoctors(doctorRes.data || []);
        setMedicalRecords(recordsRes.data || []);
      } catch (error) {
        show(error?.response?.data?.message || 'Unable to load patient dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadInitialData();
    }
  }, [patientId, show]);

  const filteredDoctors = useMemo(() => {
    if (!selectedClinic) return doctors;
    return doctors.filter((doctor) => doctor.clinicId === Number(selectedClinic));
  }, [doctors, selectedClinic]);

  const refreshAppointments = async () => {
    try {
      const res = await appointmentAPI.listForPatient(patientId);
      setAppointments(res.data || []);
    } catch (error) {
      show(error?.userMessage || 'Unable to refresh appointments.', 'error');
    }
  };

  // load time slots whenever clinic/doctor/date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedClinic || !selectedDoctor || !selectedDate) {
        setTimeSlots([]);
        return;
      }
      setSlotsLoading(true);
      try {
        const scheduleRes = await doctorAPI.getSchedule(Number(selectedDoctor));
        const slotInterval = scheduleRes.data?.slotIntervalMinutes || 15;

        const apptRes = await appointmentAPI.listForClinic(Number(selectedClinic), selectedDate);
        const occupied = (apptRes.data || []).map((a) => toLocalInputValue(a.dateTime));

        const clinic = clinics.find((c) => c.id === Number(selectedClinic));
        const openTime = clinic?.openTime || '09:00:00';
        const closeTime = clinic?.closeTime || '17:00:00';

        const parseTime = (t) => {
          const parts = t.split(':');
          return { hh: Number(parts[0]), mm: Number(parts[1]) };
        };

        const open = parseTime(openTime);
        const close = parseTime(closeTime);

        const slots = [];
        const start = new Date(
          `${selectedDate}T${String(open.hh).padStart(2, '0')}:${String(open.mm).padStart(
            2,
            '0'
          )}:00`
        );
        const end = new Date(
          `${selectedDate}T${String(close.hh).padStart(2, '0')}:${String(close.mm).padStart(
            2,
            '0'
          )}:00`
        );
        for (let d = new Date(start); d < end; d.setMinutes(d.getMinutes() + slotInterval)) {
          const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          // isoLocal is YYYY-MM-DDTHH:MM
          const timeOnly = isoLocal.slice(11, 16);
          if (!occupied.includes(isoLocal)) {
            slots.push(timeOnly);
          }
        }
        setTimeSlots(slots);
        if (!slots.includes(selectedSlot)) setSelectedSlot('');
      } catch {
        setTimeSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    loadSlots();
  }, [selectedClinic, selectedDoctor, selectedDate, clinics, selectedSlot]);

  // load slots for reschedule when clinic/doctor/date changes
  useEffect(() => {
    const loadRescheduleSlots = async () => {
      if (!rescheduleClinic || !rescheduleDoctor || !rescheduleSelectedDate) {
        setRescheduleTimeSlots([]);
        return;
      }
      setRescheduleSlotsLoading(true);
      try {
        const scheduleRes = await doctorAPI.getSchedule(Number(rescheduleDoctor));
        const slotInterval = scheduleRes.data?.slotIntervalMinutes || 15;

        const apptRes = await appointmentAPI.listForClinic(
          Number(rescheduleClinic),
          rescheduleSelectedDate
        );
        const occupied = (apptRes.data || []).map((a) => toLocalInputValue(a.dateTime));

        const clinic = clinics.find((c) => c.id === Number(rescheduleClinic));
        const openTime = clinic?.openTime || '09:00:00';
        const closeTime = clinic?.closeTime || '17:00:00';

        const parseTime = (t) => {
          const parts = t.split(':');
          return { hh: Number(parts[0]), mm: Number(parts[1]) };
        };

        const open = parseTime(openTime);
        const close = parseTime(closeTime);

        const slots = [];
        const start = new Date(
          `${rescheduleSelectedDate}T${String(open.hh).padStart(2, '0')}:${String(open.mm).padStart(
            2,
            '0'
          )}:00`
        );
        const end = new Date(
          `${rescheduleSelectedDate}T${String(close.hh).padStart(2, '0')}:${String(
            close.mm
          ).padStart(2, '0')}:00`
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
        setRescheduleTimeSlots(slots);
        if (!slots.includes(rescheduleSelectedSlot)) setRescheduleSelectedSlot('');
      } catch {
        setRescheduleTimeSlots([]);
      } finally {
        setRescheduleSlotsLoading(false);
      }
    };
    loadRescheduleSlots();
  }, [rescheduleClinic, rescheduleDoctor, rescheduleSelectedDate, clinics, rescheduleSelectedSlot]);

  const fetchMedicalRecords = async () => {
    if (!patientId) {
      return;
    }
    try {
      setMedicalLoading(true);
      const res = await patientAPI.medicalRecords(patientId);
      setMedicalRecords(res.data || []);
    } catch (error) {
      show(error?.response?.data?.message || 'Unable to load medical history.', 'error');
    } finally {
      setMedicalLoading(false);
    }
  };

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    if (!selectedClinic || !selectedDoctor || !selectedSlot) {
      show('Please complete all booking details.', 'error');
      return;
    }
    try {
      // combine selectedDate and selectedSlot into a local Date and send ISO instant
      const combined = new Date(`${selectedDate}T${selectedSlot}:00`);
      const iso = combined.toISOString();
      await appointmentAPI.book(patientId, {
        clinicId: Number(selectedClinic),
        doctorId: Number(selectedDoctor),
        dateTime: iso,
      });
      show('Appointment booked successfully.', 'success');
      refreshAppointments();
    } catch (error) {
      show(
        error?.userMessage || error?.response?.data?.message || 'Unable to book appointment.',
        'error'
      );
    }
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      await queueAPI.checkIn(appointmentId);
      show('Checked in successfully. Track your queue status below.', 'success');
      setCheckedInAppointmentId(appointmentId);
      await fetchQueueStatus();
      refreshAppointments();
    } catch (error) {
      show(error?.userMessage || error.response?.data?.message || 'Unable to check in.', 'error');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.cancel(appointmentId);
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
    // enforce 24-hour rule on UI when opening the reschedule form
    const now = new Date();
    const apptDate = new Date(appointment.dateTime);
    const msDiff = apptDate.getTime() - now.getTime();
    if (msDiff < 24 * 60 * 60 * 1000) {
      show('Rescheduling is allowed only more than 24 hours before the appointment.', 'error');
      return;
    }

    setRescheduleTarget(appointment);
    setRescheduleClinic(String(appointment.clinicId));
    setRescheduleDoctor(String(appointment.doctorId));
    const local = toLocalInputValue(appointment.dateTime); // YYYY-MM-DDTHH:MM
    setRescheduleSelectedDate(local.slice(0, 10));
    setRescheduleSelectedSlot(local.slice(11, 16));
  };

  const cancelReschedule = () => {
    setRescheduleTarget(null);
    setRescheduleClinic('');
    setRescheduleDoctor('');
    setRescheduleSelectedDate('');
    setRescheduleSelectedSlot('');
  };

  const handleRescheduleSubmit = async (event) => {
    event.preventDefault();
    if (
      !rescheduleTarget ||
      !rescheduleClinic ||
      !rescheduleDoctor ||
      !rescheduleSelectedDate ||
      !rescheduleSelectedSlot
    ) {
      show('Please fill in the new appointment details.', 'error');
      return;
    }
    try {
      // double-check 24-hour rule before submitting
      const now = new Date();
      const apptDate = new Date(rescheduleTarget.dateTime);
      const msDiff = apptDate.getTime() - now.getTime();
      if (msDiff < 24 * 60 * 60 * 1000) {
        show('Rescheduling is allowed only more than 24 hours before the appointment.', 'error');
        return;
      }
      const combined = new Date(`${rescheduleSelectedDate}T${rescheduleSelectedSlot}:00`);
      const iso = combined.toISOString();
      await appointmentAPI.reschedule(rescheduleTarget.id, {
        clinicId: Number(rescheduleClinic),
        doctorId: Number(rescheduleDoctor),
        dateTime: iso,
      });
      show('Appointment rescheduled.', 'success');
      cancelReschedule();
      refreshAppointments();
    } catch (error) {
      show(
        error?.userMessage || error?.response?.data?.message || 'Unable to reschedule appointment.',
        'error'
      );
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const res = await queueAPI.getPatientStatus(patientId);
      setQueueStatus(res.data);
    } catch (error) {
      setQueueStatus(null);
      show(
        error?.userMessage || error.response?.data?.message || 'No active queue status found.',
        'info'
      );
    }
  };

  const toLocalInputValue = (value) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const adjusted = new Date(date.getTime() - offset * 60000);
    return adjusted.toISOString().slice(0, 16);
  };

  const mapQueueStatusLabel = (status) => {
    if (!status) return 'UNKNOWN';
    switch (String(status).toUpperCase()) {
      case 'WAITING':
        return 'Waiting';
      case 'CALLED':
        return 'Called';
      case 'IN_SERVICE':
        return 'In Service';
      case 'DONE':
        return 'Done';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return String(status);
    }
  };

  const rescheduleDoctors = useMemo(() => {
    if (!rescheduleClinic) return doctors;
    return doctors.filter((doctor) => doctor.clinicId === Number(rescheduleClinic));
  }, [doctors, rescheduleClinic]);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div>
      <h2 className="section-title">Welcome back{userName ? `, ${userName}` : ''}!</h2>

      <div className="grid">
        <div className="card">
          <h3>Upcoming Appointments</h3>
          {appointments.filter((a) => a.status !== 'COMPLETED').length === 0 ? (
            <p style={{ marginTop: 16, color: '#666' }}>No appointments scheduled.</p>
          ) : (
            <div className="list">
              {appointments
                .filter((a) => a.status !== 'COMPLETED')
                .map((appointment) => (
                  <div key={appointment.id} className="list-item">
                    <div>
                      <strong>{new Date(appointment.dateTime).toLocaleString()}</strong>
                      <div>Clinic #{appointment.clinicId}</div>
                      <div>Doctor #{appointment.doctorId}</div>
                      <div>Status: {appointment.status}</div>
                    </div>
                    {appointment.status === 'SCHEDULED' && (
                      <div className="actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleCheckIn(appointment.id)}
                        >
                          Check In
                        </button>
                        <button
                          className="btn btn-warning"
                          onClick={() => startReschedule(appointment)}
                        >
                          Reschedule
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleCancelAppointment(appointment.id)}
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

        {/* Queue Status is hidden by default. It appears only after the patient checks in to an appointment. */}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Medical History</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchMedicalRecords}
              disabled={medicalLoading}
            >
              {medicalLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {medicalLoading ? (
            <p style={{ marginTop: 16, color: '#666' }}>Loading medical records...</p>
          ) : medicalRecords.length === 0 ? (
            <p style={{ marginTop: 16, color: '#666' }}>No medical records available yet.</p>
          ) : (
            <div className="list">
              {medicalRecords.map((record) => (
                <Link
                  key={record.id}
                  to={`/medical-records/${record.id}`}
                  state={{ record, patientId }}
                  className="list-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div>
                    <strong>
                      {record.recordDate
                        ? new Date(record.recordDate).toLocaleString()
                        : 'Date not available'}
                    </strong>
                    {record.clinicName && <div>Clinic: {record.clinicName}</div>}
                    {record.doctorName && <div>Doctor: {record.doctorName}</div>}
                    {record.diagnosis && <div>Diagnosis: {record.diagnosis}</div>}
                    {record.treatment && <div>Treatment: {record.treatment}</div>}
                    <div style={{ marginTop: 6, color: '#666' }}>Click for details</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Render queue status only when a check-in has occurred for a specific appointment */}
        {checkedInAppointmentId && (
          <div className="card">
            <h3>Your Queue Status (for appointment #{checkedInAppointmentId})</h3>
            <button className="btn btn-secondary" onClick={fetchQueueStatus}>
              Refresh Queue Status
            </button>
            {queueStatus ? (
              <div className="queue-status">
                <p>
                  <strong>Your Number:</strong> {queueStatus.queueNumber ?? 'Not checked in'}
                </p>
                <p>
                  <strong>Current Number:</strong> {queueStatus.currentNumber ?? '-'}
                </p>
                <p>
                  <strong>Numbers Away:</strong> {queueStatus.numbersAway ?? '-'}
                </p>
                <p>
                  <strong>Queue State:</strong> {queueStatus.state ?? 'UNKNOWN'}
                </p>
                <p>
                  <strong>Entry Status:</strong> {mapQueueStatusLabel(queueStatus.status)}
                </p>
              </div>
            ) : (
              <p style={{ marginTop: 16, color: '#666' }}>No active queue information yet.</p>
            )}
          </div>
        )}

        <div className="card">
          <h3>Book a New Appointment</h3>
          <form className="form" onSubmit={handleBookAppointment}>
            <div className="form-group">
              <label>Select Clinic</label>
              <select
                value={selectedClinic}
                onChange={(event) => {
                  setSelectedClinic(event.target.value);
                  setSelectedDoctor('');
                }}
                required
              >
                <option value="">Choose a clinic...</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Doctor</label>
              <select
                value={selectedDoctor}
                onChange={(event) => setSelectedDoctor(event.target.value)}
                required
                disabled={!selectedClinic}
              >
                <option value="">Choose a doctor...</option>
                {filteredDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName || `Doctor #${doctor.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Time Slot</label>
              {slotsLoading ? (
                <div>Loading slots...</div>
              ) : (
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  required
                >
                  <option value="">Choose a time...</option>
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button type="submit" className="btn btn-success">
              Confirm Booking
            </button>
          </form>
        </div>

        {rescheduleTarget && (
          <div className="card">
            <h3>Reschedule Appointment #{rescheduleTarget.id}</h3>
            <form className="form" onSubmit={handleRescheduleSubmit}>
              <div className="form-group">
                <label>Clinic</label>
                <select
                  value={rescheduleClinic}
                  onChange={(event) => {
                    setRescheduleClinic(event.target.value);
                    setRescheduleDoctor('');
                  }}
                  required
                >
                  <option value="">Choose a clinic...</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Doctor</label>
                <select
                  value={rescheduleDoctor}
                  onChange={(event) => setRescheduleDoctor(event.target.value)}
                  required
                  disabled={!rescheduleClinic}
                >
                  <option value="">Choose a doctor...</option>
                  {rescheduleDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.fullName || `Doctor #${doctor.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>New Date & Time</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="date"
                    value={rescheduleSelectedDate}
                    onChange={(event) => setRescheduleSelectedDate(event.target.value)}
                    required
                  />
                  {rescheduleSlotsLoading ? (
                    <div>Loading slots...</div>
                  ) : (
                    <select
                      value={rescheduleSelectedSlot}
                      onChange={(e) => setRescheduleSelectedSlot(e.target.value)}
                      required
                      disabled={!rescheduleSelectedDate}
                    >
                      <option value="">Choose a time...</option>
                      {rescheduleTimeSlots.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="actions">
                <button type="submit" className="btn btn-success">
                  Save Changes
                </button>
                <button type="button" className="btn btn-secondary" onClick={cancelReschedule}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
