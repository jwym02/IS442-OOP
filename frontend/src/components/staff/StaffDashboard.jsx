/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  ClipboardList,
  UserPlus,
  RefreshCw,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Zap,
  FileText,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { appointmentAPI, clinicAPI, doctorAPI, queueAPI } from '../../services/api';
import { useToast } from '../../context/useToast';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '../../lib/utils';

export default function StaffDashboard({ clinicId, staffProfileId, doctorProfileId, staffName }) {
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
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
  const [filterClinic, setFilterClinic] = useState(String(clinicId || ''));
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const isStaff = Boolean(staffProfileId);
  const isDoctor = Boolean(doctorProfileId) && !isStaff;

  // Appointments tab
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('all'); // all | today | week | month
  const ITEMS_PER_PAGE = 10;

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
              appointmentAPI.listForClinic(clinicId, null, 'upcoming'),
              queueAPI.staffQueueStatus(clinicId),
              queueAPI.staffDailyReport(clinicId),
              queueAPI.staffQueueEntries(clinicId),
              doctorAPI.getAll(),
              clinicAPI.getAll(),
            ]);

          const appointmentsData = appointmentRes.data || [];

          // Mark appointments as NO_SHOW if > 3 hours past appointment time
          const now = new Date();
          const threeHoursInMs = 3 * 60 * 60 * 1000;
          const updatePromises = [];

          appointmentsData.forEach((appt) => {
            if (appt.status === 'SCHEDULED') {
              const apptTime = new Date(appt.dateTime);
              const timeDiff = now - apptTime;
              if (timeDiff > threeHoursInMs) {
                // Update status to NO_SHOW in backend
                updatePromises.push(
                  appointmentAPI.updateStatus(appt.id, 'NO_SHOW').catch((err) => {
                    console.error(`Failed to update appointment ${appt.id} to NO_SHOW:`, err);
                    return null;
                  })
                );
              }
            }
          });

          // Wait for all status updates to complete
          if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            // Re-fetch appointments to get updated statuses
            const updatedRes = await appointmentAPI.listForClinic(clinicId, null, 'upcoming');
            setAppointments(updatedRes.data || []);
          } else {
            setAppointments(appointmentsData);
          }

          setQueueStatus(queueRes.data || null);
          setDailyReport(reportRes.data || null);
          setQueueEntries(entriesRes.data || []);
          setDoctors((doctorRes.data || []).filter((doctor) => doctor.clinicId === clinicId));
          setClinics(clinicRes.data || []);
          setFilterClinic(String(clinicId || ''));
        } else if (isDoctor && doctorProfileId) {
          const [appointmentRes, queueRes] = await Promise.all([
            appointmentAPI.listForDoctor(doctorProfileId),
            queueAPI.staffQueueStatus(clinicId),
          ]);

          const appointmentsData = appointmentRes.data || [];

          // Mark appointments as NO_SHOW if > 3 hours past appointment time
          const now = new Date();
          const threeHoursInMs = 3 * 60 * 60 * 1000;
          const updatePromises = [];

          appointmentsData.forEach((appt) => {
            if (appt.status === 'SCHEDULED') {
              const apptTime = new Date(appt.dateTime);
              const timeDiff = now - apptTime;
              if (timeDiff > threeHoursInMs) {
                // Update status to NO_SHOW in backend
                updatePromises.push(
                  appointmentAPI.updateStatus(appt.id, 'NO_SHOW').catch((err) => {
                    console.error(`Failed to update appointment ${appt.id} to NO_SHOW:`, err);
                    return null;
                  })
                );
              }
            }
          });

          // Wait for all status updates to complete
          if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            // Re-fetch appointments to get updated statuses
            const updatedRes = await appointmentAPI.listForDoctor(doctorProfileId);
            setAppointments(updatedRes.data || []);
          } else {
            setAppointments(appointmentsData);
          }

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

  useEffect(() => {
    if (dateFilter === "today") {
      const today = new Date().toISOString().slice(0, 10);
      setFilterDate(today);
    }
  }, [dateFilter]);

  const refreshAppointments = async () => {
    try {
      if (isStaff) {
        const res = await appointmentAPI.listForClinic(clinicId, null, 'upcoming');
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
      console.log(queueStatus)
    } catch (error) {
      show(error?.userMessage || 'Unable to refresh queue status.', 'error');
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
      show(error?.userMessage || 'Unable to refresh queue entries.', 'error');
    }
  };

  const refreshDailyReport = async () => {
    if (!isStaff) return;
    try {
      const res = await queueAPI.staffDailyReport(clinicId);
      setDailyReport(res.data || null);
    } catch (error) {
      show(error?.userMessage || 'Unable to refresh report.', 'error');
    }
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      await queueAPI.checkIn(appointmentId);
      show('Patient checked in and added to queue.', 'success');
      refreshQueueEntries();
      refreshQueueStatus();
      refreshAppointments();
      refreshDailyReport();
    } catch (error) {
      show(error?.userMessage || 'Unable to check in patient.', 'error');
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
      if (action == 'next') {
        show(error?.userMessage || 'No patients in queue', 'error');
      } else {
        show(error?.userMessage || 'Unable to update queue', 'error');
      }
    }
  };

  const handleQueueStatusUpdate = async (queueNumber, status) => {
    try {
      await queueAPI.staffMarkStatus(queueNumber, { clinicId, status });
      show('Queue status updated.', 'success');
      refreshQueueStatus();
      refreshQueueEntries();
      refreshAppointments();
      refreshDailyReport();
    } catch (error) {
      show(error?.userMessage || 'Unable to update queue status.', 'error');
    }
  };

  const handleFastTrack = async (queueNumber) => {
    try {
      await queueAPI.staffFastTrack(clinicId, queueNumber);
      show('Patient fast-tracked.', 'success');
      refreshQueueEntries();
      refreshQueueStatus();
    } catch (error) {
      show(error?.userMessage || 'Unable to fast-track.', 'error');
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
      refreshDailyReport();
    } catch (error) {
      show(error?.userMessage || 'Unable to register walk-in.', 'error');
    }
  };

  const handleStaffCancel = async (appointmentId) => {
    try {
      await appointmentAPI.staffCancel(appointmentId);
      show('Appointment cancelled.', 'success');
      refreshAppointments();
      refreshDailyReport();
    } catch (error) {
      show(error?.userMessage || 'Unable to cancel appointment.', 'error');
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

    const newDate = new Date(rescheduleDateTime);
    const now = new Date();
    if (newDate < now) {
      show('You cannot reschedule to a past date/time.', 'error');
      return;
    }

    try {
      // Fetch clinic hours
      const clinicRes = await clinicAPI.getAll();
      const currentClinic = (clinicRes.data || []).find((c) => c.id === clinicId);
      const openTime = currentClinic?.openTime || '09:00';
      const closeTime = currentClinic?.closeTime || '17:00';

      // Fetch doctor schedule
      const doctorScheduleRes = await doctorAPI.getSchedule(Number(rescheduleDoctorId));
      const slotInterval = doctorScheduleRes.data?.slotIntervalMinutes || 15;
      const doctorOpen = doctorScheduleRes.data?.openTime || openTime;
      const doctorClose = doctorScheduleRes.data?.closeTime || closeTime;

      // Parse time range and validate
      const [clinicOpenHour, clinicOpenMin] = openTime.split(':').map(Number);
      const [clinicCloseHour, clinicCloseMin] = closeTime.split(':').map(Number);
      const [doctorOpenHour, doctorOpenMin] = doctorOpen.split(':').map(Number);
      const [doctorCloseHour, doctorCloseMin] = doctorClose.split(':').map(Number);

      const hour = newDate.getHours();
      const minute = newDate.getMinutes();

      const withinClinic =
        hour > clinicOpenHour &&
        (hour < clinicCloseHour || (hour === clinicCloseHour && minute < clinicCloseMin));
      const withinDoctor =
        hour > doctorOpenHour &&
        (hour < doctorCloseHour || (hour === doctorCloseHour && minute < doctorCloseMin));

      if (!withinClinic) {
        show(`Time must be within clinic hours (${openTime}–${closeTime}).`, 'error');
        return;
      }
      if (!withinDoctor) {
        show(`Time must be within doctor’s hours (${doctorOpen}–${doctorClose}).`, 'error');
        return;
      }

      const selectedDoctor = doctors.find((d) => d.id === Number(rescheduleDoctorId));
      if (!selectedDoctor || selectedDoctor.clinicId !== clinicId) {
        show('Selected doctor does not belong to this clinic.', 'error');
        return;
      }

      const conflict = appointments.some((a) => {
        return (
          Number(a.doctorId) === Number(rescheduleDoctorId) &&
          new Date(a.dateTime).getTime() === newDate.getTime() &&
          a.id !== rescheduleTarget.id &&
          a.status !== 'CANCELLED' &&
          a.status !== 'COMPLETED'
        );
      });
      if (conflict) {
        show('The selected doctor already has an appointment at this time.', 'error');
        return;
      }

      const iso = newDate.toISOString();
      await appointmentAPI.staffReschedule(rescheduleTarget.id, {
        clinicId,
        doctorId: Number(rescheduleDoctorId),
        dateTime: iso,
      });

      show('Appointment rescheduled.', 'success');
      cancelRescheduleForm();
      refreshAppointments();
      refreshDailyReport();
    } catch (error) {
      show(error?.userMessage || 'Unable to reschedule appointment.', 'error');
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

  const now = new Date();

  // Normalize appointments for display - mark as NO_SHOW if > 3 hours past appointment time
  const normalizedAppointments = useMemo(() => {
    const currentTime = new Date();
    const threeHoursInMs = 3 * 60 * 60 * 1000;

    return (appointments || []).map((appt) => {
      const copy = { ...appt };
      const apptDate = new Date(appt.dateTime);
      const statusUpper = String(appt.status || '').toUpperCase();

      // Check if appointment should be marked as NO_SHOW
      // (scheduled appointment that is more than 3 hours past)
      if (statusUpper === 'SCHEDULED') {
        const timeDiff = currentTime - apptDate;
        if (timeDiff > threeHoursInMs) {
          copy.status = 'NO_SHOW';
        }
      }

      return copy;
    });
  }, [appointments]);

  const applyDateFilter = (list) => {
    if (dateFilter === 'today') {
      return list.filter((a) => {
        const d = new Date(a.dateTime);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      });
    } else if (dateFilter === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return list.filter((a) => {
        const d = new Date(a.dateTime);
        return d >= start && d < end;
      });
    } else if (dateFilter === 'month') {
      return list.filter((a) => {
        const d = new Date(a.dateTime);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }
    return list;
  };

  const filteredAppointments = useMemo(() => {
    let list = normalizedAppointments || [];
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
    list = applyDateFilter(list);
    return list.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }, [normalizedAppointments, filterClinic, filterDoctor, filterDate, dateFilter, applyDateFilter]);

  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isSameDay = (a, b) => {
    const da = new Date(a);
    return (
      da.getFullYear() === b.getFullYear() &&
      da.getMonth() === b.getMonth() &&
      da.getDate() === b.getDate()
    );
  };

  const visibleQueueEntries = useMemo(
    () => (queueEntries || []).filter((e) => e.status !== 'SERVED'),
    [queueEntries]
  );

  const todayAppointments = useMemo(() => {
    return (normalizedAppointments || []).filter((apt) => isSameDay(apt.dateTime, new Date()));
  }, [normalizedAppointments]);

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

  const formatDateTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const appointmentStatusStyles = {
    SCHEDULED: 'border-blue-200 bg-blue-50 text-blue-700',
    CHECKED_IN: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    IN_PROGRESS: 'border-sky-200 bg-sky-50 text-sky-700',
    COMPLETED: 'border-slate-200 bg-slate-100 text-slate-600',
    CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
    NO_SHOW: 'border-orange-200 bg-orange-50 text-orange-700',
  };

  const queueStatusStyles = {
    WAITING: 'border-blue-200 bg-blue-50 text-blue-700',
    FAST_TRACKED: 'border-purple-200 bg-purple-50 text-purple-700',
    CALLED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    SERVED: 'border-slate-200 bg-slate-100 text-slate-600',
    CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
    SKIPPED: 'border-orange-200 bg-orange-50 text-orange-700',
  };

  if (!clinicId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Clinic Assigned</AlertTitle>
          <AlertDescription>
            Please contact the administrator to assign you to a clinic.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading clinic dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isStaff ? 'Clinic Operations' : 'Doctor Dashboard'}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {staffName ? `Welcome, ${staffName}` : 'Manage appointments and patient queue'}
              </p>
            </div>
            <div className="flex gap-2">
              {isDoctor && (
                <Link to="/doctor/notes">
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Notes Editor
                  </Button>
                </Link>
              )}
              <Button
                onClick={() => {
                  refreshAppointments();
                  refreshQueueStatus();
                  refreshQueueEntries();
                  refreshDailyReport();
                }}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh All
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8 -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp, staffOnly: false },
              { id: 'appointments', label: 'Appointments', icon: Calendar, staffOnly: false },
              { id: 'queue', label: 'Queue Management', icon: Users, staffOnly: true },
              { id: 'walk-in', label: 'Walk-in Registration', icon: UserPlus, staffOnly: true },
              { id: 'reports', label: 'Reports', icon: ClipboardList, staffOnly: true },
            ]
              .filter((tab) => !tab.staffOnly || isStaff)
              .map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }
                    `}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {isStaff && dailyReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Today"
                  value={dailyReport.totalAppointments || 0}
                  icon={Calendar}
                  color="blue"
                />
                <StatCard
                  title="Completed"
                  value={dailyReport.completedAppointments || 0}
                  icon={CheckCircle2}
                  color="green"
                />
                <StatCard
                  title="Patients Waiting"
                  value={dailyReport.patientsWaiting || 0}
                  icon={Clock}
                  color="orange"
                />
                <StatCard
                  title="No Shows"
                  value={dailyReport.noShowAppointments || 0}
                  icon={XCircle}
                  color="red"
                />
              </div>
            )}

            {/* Queue Status Card */}
            {isStaff && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Queue Status</CardTitle>
                      <CardDescription>Real-time clinic queue monitoring</CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-sm capitalize',
                        queueStatus?.state === 'ACTIVE'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : queueStatus?.state === 'PAUSED'
                          ? 'border-orange-200 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-slate-100 text-slate-600'
                      )}
                    >
                      {queueStatus?.state || 'IDLE'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                        Now Serving
                      </p>
                      <p className="text-4xl font-bold text-blue-600">
                        {queueStatus?.currentNumber ?? '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                        Patients Waiting
                      </p>
                      <p className="text-4xl font-bold text-orange-600">
                        {queueStatus?.waitingCount ?? 0}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                        Queue State
                      </p>
                      <p 
                      className={cn(
                        'text-2xl font-bold text-slate-900',
                        queueStatus?.state === 'ACTIVE'
                          ? 'text-green-700'
                          : queueStatus?.state === 'PAUSED' ? 'text-orange-700' : 'text-slate-600'
                      )}>
                        {queueStatus?.state || 'IDLE'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleQueueAction('start')}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4" />
                      Start Queue
                    </Button>
                    <Button
                      onClick={() => handleQueueAction('pause')}
                      variant="outline"
                      className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <Pause className="h-4 w-4" />
                      Pause Queue
                    </Button>
                    <Button
                      onClick={() => handleQueueAction('next')}
                      variant="outline"
                      className="gap-2"
                    >
                      <SkipForward className="h-4 w-4" />
                      Call Next
                    </Button>
                    <Button onClick={refreshQueueStatus} variant="ghost" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Appointments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today's Schedule</CardTitle>
                    <CardDescription>
                      {todayAppointments.length} appointments scheduled for today
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('appointments')}
                    className="gap-2"
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {todayAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {todayAppointments.slice(0, 5).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatTime(appointment.dateTime)}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'capitalize border text-xs',
                                  appointmentStatusStyles[appointment.status] ||
                                    'border-slate-200 bg-slate-100 text-slate-600'
                                )}
                              >
                                {appointment.status.replace(/_/g, ' ').toLowerCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600">
                              {appointment.patientName || `Patient #${appointment.patientId}`}
                              {isStaff &&
                                ` • ${appointment.doctorName || `Doctor #${appointment.doctorId}`}`}
                            </p>
                          </div>
                          {isStaff && appointment.status === 'SCHEDULED' && (
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(appointment.id)}
                              className="gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Check-in
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600">No appointments scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Queue Preview */}
            {isStaff && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Active Queue</CardTitle>
                      <CardDescription>
                        {visibleQueueEntries.length} patients in queue
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('queue')}
                      className="gap-2"
                    >
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {visibleQueueEntries.length > 0 ? (
                    <div className="space-y-2">
                      {visibleQueueEntries.slice(0, 5).map((entry) => (
                        <div
                          key={entry.queueNumber}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              #{entry.queueNumber}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {entry.patientName || `Patient #${entry.patientId}`}
                              </p>
                              <p className="text-xs text-slate-500">
                                {entry.doctorName || `Doctor #${entry.doctorId}`}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'capitalize border',
                              queueStatusStyles[entry.status] ||
                                'border-slate-200 bg-slate-100 text-slate-600'
                            )}
                          >
                            {entry.status.replace(/_/g, ' ').toLowerCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                      <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-sm text-slate-600">No patients in queue</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Reschedule Form */}
            {rescheduleTarget && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle>Reschedule Appointment #{rescheduleTarget.id}</CardTitle>
                  <CardDescription>Update doctor or time slot for this appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={handleRescheduleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="reschedule-doctor">Doctor</Label>
                        <Select
                          id="reschedule-doctor"
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
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reschedule-datetime">New Date & Time</Label>
                        <Input
                          id="reschedule-datetime"
                          type="datetime-local"
                          value={rescheduleDateTime}
                          onChange={(event) => setRescheduleDateTime(event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button type="button" variant="outline" onClick={cancelRescheduleForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Appointments List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{isDoctor ? 'Your Appointments' : 'All Appointments'} ({filteredAppointments.length})</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={refreshAppointments}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                {isStaff && (
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="filter-clinic">Clinic</Label>
                      <Select
                        id="filter-clinic"
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
                      </Select>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="filter-doctor">Doctor</Label>
                      <Select
                        id="filter-doctor"
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
                      </Select>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="filter-date">Date</Label>
                      <Input
                        id="filter-date"
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setFilterClinic(String(clinicId || ''));
                          setFilterDoctor('');
                          setFilterDate('');
                          setDateFilter("all");
                        }}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {['all', 'today', 'week', 'month'].map((f) => (
                    <Button
                      key={f}
                      variant={dateFilter === f ? 'default' : 'outline'}
                      onClick={() => {
                        setDateFilter(f);
                        setCurrentPage(1);
                      }}
                    >
                      {f === 'all' && 'All'}
                      {f === 'today' && 'Today'}
                      {f === 'week' && 'This Week'}
                      {f === 'month' && 'This Month'}
                    </Button>
                  ))}
                </div>

                {filteredAppointments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600">No upcoming appointments</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Patient</TableHead>
                          {isStaff && <TableHead>Doctor</TableHead>}
                          <TableHead>Status</TableHead>
                          {isStaff && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium">
                              {formatDateTime(appointment.dateTime)}
                            </TableCell>
                            <TableCell>
                              {appointment.patientName || `Patient #${appointment.patientId}`}
                            </TableCell>
                            {isStaff && (
                              <TableCell>
                                {appointment.doctorName || `Doctor #${appointment.doctorId}`}
                              </TableCell>
                            )}
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'capitalize border',
                                  appointmentStatusStyles[appointment.status] ||
                                    'border-slate-200 bg-slate-100 text-slate-600'
                                )}
                              >
                                {appointment.status.replace(/_/g, ' ').toLowerCase()}
                              </Badge>
                            </TableCell>
                            {isStaff && (
                              <TableCell>
                                <div className="flex gap-2">
                                  {appointment.status === 'SCHEDULED' &&
                                    isSameDay(appointment.dateTime, new Date()) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => handleCheckIn(appointment.id)}
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Check-in
                                      </Button>
                                    )}
                                  {appointment.status !== 'COMPLETED' &&
                                    appointment.status !== 'CANCELLED' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startReschedule(appointment)}
                                        >
                                          Reschedule
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-rose-600 hover:bg-rose-50"
                                          onClick={() => handleStaffCancel(appointment.id)}
                                        >
                                          Cancel
                                        </Button>
                                      </>
                                    )}
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center px-4 py-3  rounded-lg">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <p className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </p>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Queue Management Tab */}
        {activeTab === 'queue' && isStaff && (
          <div className="space-y-6">
            {/* Queue Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Queue Controls</CardTitle>
                <CardDescription>Start, pause, and manage the patient queue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                      Now Serving
                    </p>
                    <p className="text-4xl font-bold text-blue-600">
                      {queueStatus?.currentNumber ?? '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                      Patients Waiting
                    </p>
                    <p className="text-4xl font-bold text-orange-600">
                      {queueStatus?.waitingCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                      Queue State
                    </p>
                    <p 
                    className={cn(
                      'text-2xl font-bold text-slate-900',
                      queueStatus?.state === 'ACTIVE'
                        ? 'text-green-700'
                        : queueStatus?.state === 'PAUSED' ? 'text-orange-700' : 'text-slate-600'
                    )}>
                      {queueStatus?.state || 'IDLE'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleQueueAction('start')}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4" />
                    Start Queue
                  </Button>
                  <Button
                    onClick={() => handleQueueAction('pause')}
                    variant="outline"
                    className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <Pause className="h-4 w-4" />
                    Pause Queue
                  </Button>
                  <Button
                    onClick={() => handleQueueAction('next')}
                    variant="outline"
                    className="gap-2"
                  >
                    <SkipForward className="h-4 w-4" />
                    Call Next Patient
                  </Button>
                  <Button
                    onClick={() => {
                      refreshQueueStatus();
                      refreshQueueEntries();
                    }}
                    variant="ghost"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Queue
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Queue Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Queue Entries</CardTitle>
                <CardDescription>
                  {visibleQueueEntries.length} patients currently in queue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {visibleQueueEntries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600">No patients have checked in yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleQueueEntries.map((entry) => (
                      <div
                        key={entry.queueNumber}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
                              #{entry.queueNumber}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {entry.patientName || `Patient #${entry.patientId}`}
                              </p>
                              <p className="text-sm text-slate-600">
                                {entry.doctorName || `Doctor #${entry.doctorId}`}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'capitalize border',
                              queueStatusStyles[entry.status] ||
                                'border-slate-200 bg-slate-100 text-slate-600'
                            )}
                          >
                            {entry.status.replace(/_/g, ' ').toLowerCase()}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {entry.status === 'WAITING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                              onClick={() => handleFastTrack(entry.queueNumber)}
                            >
                              <Zap className="h-4 w-4" />
                              Fast Track
                            </Button>
                          )}
                          {['WAITING', 'FAST_TRACKED', 'CALLED'].includes(entry.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-2 text-rose-600 hover:bg-rose-50"
                              onClick={() =>
                                handleQueueStatusUpdate(entry.queueNumber, 'CANCELLED')
                              }
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel
                            </Button>
                          )}
                          {entry.status === 'CALLED' && (
                            <>
                              <Button
                                size="sm"
                                className="gap-2 bg-green-600 hover:bg-green-700"
                                onClick={() => handleQueueStatusUpdate(entry.queueNumber, 'SERVED')}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Mark Served
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={() =>
                                  handleQueueStatusUpdate(entry.queueNumber, 'SKIPPED')
                                }
                              >
                                <AlertCircle className="h-4 w-4" />
                                Mark No Show
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Walk-in Registration Tab */}
        {activeTab === 'walk-in' && isStaff && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Register Walk-in Patient</CardTitle>
                <CardDescription>Manually add a walk-in appointment to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleWalkInSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="walkin-patient">Patient ID</Label>
                      <Input
                        id="walkin-patient"
                        type="number"
                        min="1"
                        value={walkInPatientId}
                        onChange={(event) => setWalkInPatientId(event.target.value)}
                        placeholder="Enter patient ID"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="walkin-doctor">Doctor</Label>
                      <Select
                        id="walkin-doctor"
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
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="walkin-date">Appointment Date</Label>
                      <Input
                        id="walkin-date"
                        type="date"
                        value={walkInSelectedDate}
                        onChange={(event) => setWalkInSelectedDate(event.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="walkin-time">Time Slot</Label>
                      {walkInSlotsLoading ? (
                        <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                          Checking availability...
                        </div>
                      ) : (
                        <Select
                          id="walkin-time"
                          value={walkInSelectedSlot}
                          onChange={(e) => setWalkInSelectedSlot(e.target.value)}
                          required
                          disabled={!walkInSelectedDate || !walkInDoctorId}
                        >
                          <option value="">Choose a time...</option>
                          {walkInTimeSlots.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2">
                    <UserPlus className="h-4 w-4" />
                    Register Walk-in Appointment
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Walk-in Registration Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Verify Patient Information</p>
                      <p className="text-sm text-slate-600">
                        Ensure you have the correct patient ID from the system before creating the
                        appointment.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Select Available Doctor</p>
                      <p className="text-sm text-slate-600">
                        Choose from doctors assigned to this clinic who have available time slots.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Pick Time Slot</p>
                      <p className="text-sm text-slate-600">
                        The system will show only available time slots based on the doctor's
                        schedule and existing appointments.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && isStaff && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Daily Clinic Report</CardTitle>
                    <CardDescription>
                      Overview of today's clinic performance and statistics
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={refreshDailyReport}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dailyReport ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Total Appointments
                          </p>
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                          {dailyReport.totalAppointments}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Completed
                          </p>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                          {dailyReport.completedAppointments}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Cancelled
                          </p>
                          <XCircle className="h-5 w-5 text-rose-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                          {dailyReport.cancelledAppointments}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-wide text-slate-500">No Shows</p>
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                          {dailyReport.noShowAppointments}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Patients Served
                          </p>
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                          {dailyReport.patientsServed}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Currently Waiting
                          </p>
                          <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                          {dailyReport.patientsWaiting}
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">
                        Performance Summary
                      </h4>
                      <div className="space-y-2 text-sm text-slate-600">
                        <p>
                          • Completion Rate:{' '}
                          <span className="font-medium text-slate-900">
                            {dailyReport.totalAppointments > 0
                              ? Math.round(
                                  (dailyReport.completedAppointments /
                                    dailyReport.totalAppointments) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </p>
                        <p>
                          • No-Show Rate:{' '}
                          <span className="font-medium text-slate-900">
                            {dailyReport.totalAppointments > 0
                              ? Math.round(
                                  (dailyReport.noShowAppointments / dailyReport.totalAppointments) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </p>
                        <p>
                          • Active Patients:{' '}
                          <span className="font-medium text-slate-900">
                            {dailyReport.patientsWaiting} waiting in queue
                          </span>
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <ClipboardList className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600">No report data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
// eslint-disable-next-line no-unused-vars
function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
