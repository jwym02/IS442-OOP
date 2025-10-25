/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  History,
  MapPin,
  PlusCircle,
  RefreshCw,
  Stethoscope,
  Users,
  ActivitySquare,
} from "lucide-react";
import { appointmentAPI, clinicAPI, doctorAPI, patientAPI, queueAPI } from "../../services/api";
import { useToast } from "../../context/useToast";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { cn } from "../../lib/utils";

export default function PatientDashboard({ patientId, userName }) {
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [checkedInAppointmentId, setCheckedInAppointmentId] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [medicalLoading, setMedicalLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleClinic, setRescheduleClinic] = useState("");
  const [rescheduleDoctor, setRescheduleDoctor] = useState("");
  const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState("");
  const [rescheduleTimeSlots, setRescheduleTimeSlots] = useState([]);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState("");
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
        show("Unable to load patient dashboard data.", "error");
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
      show("Unable to refresh appointments.", "error");
    }
  };

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
        const occupied = (apptRes.data || []).map((appointment) =>
          toLocalInputValue(appointment.dateTime)
        );

        const clinic = clinics.find((c) => c.id === Number(selectedClinic));
        const openTime = clinic?.openTime || "09:00:00";
        const closeTime = clinic?.closeTime || "17:00:00";

        const parseTime = (timeValue) => {
          const parts = timeValue.split(":");
          return { hh: Number(parts[0]), mm: Number(parts[1]) };
        };

        const open = parseTime(openTime);
        const close = parseTime(closeTime);

        const slots = [];
        const start = new Date(
          `${selectedDate}T${String(open.hh).padStart(2, "0")}:${String(open.mm).padStart(
            2,
            "0"
          )}:00`
        );
        const end = new Date(
          `${selectedDate}T${String(close.hh).padStart(2, "0")}:${String(close.mm).padStart(
            2,
            "0"
          )}:00`
        );
        for (let timeCursor = new Date(start); timeCursor < end; timeCursor.setMinutes(timeCursor.getMinutes() + slotInterval)) {
          const isoLocal = new Date(timeCursor.getTime() - timeCursor.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          const timeOnly = isoLocal.slice(11, 16);
          if (!occupied.includes(isoLocal)) {
            slots.push(timeOnly);
          }
        }
        setTimeSlots(slots);
        if (!slots.includes(selectedSlot)) {
          setSelectedSlot("");
        }
      } catch (error) {
        show(
          "Unable to load available slots.",
          "error"
        );
        setTimeSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    loadSlots();
  }, [selectedClinic, selectedDoctor, selectedDate, clinics, selectedSlot, show]);

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
        const occupied = (apptRes.data || []).map((appointment) =>
          toLocalInputValue(appointment.dateTime)
        );

        const clinic = clinics.find((c) => c.id === Number(rescheduleClinic));
        const openTime = clinic?.openTime || "09:00:00";
        const closeTime = clinic?.closeTime || "17:00:00";

        const parseTime = (timeValue) => {
          const parts = timeValue.split(":");
          return { hh: Number(parts[0]), mm: Number(parts[1]) };
        };

        const open = parseTime(openTime);
        const close = parseTime(closeTime);

        const slots = [];
        const start = new Date(
          `${rescheduleSelectedDate}T${String(open.hh).padStart(2, "0")}:${String(open.mm).padStart(
            2,
            "0"
          )}:00`
        );
        const end = new Date(
          `${rescheduleSelectedDate}T${String(close.hh).padStart(2, "0")}:${String(
            close.mm
          ).padStart(2, "0")}:00`
        );
        for (
          let timeCursor = new Date(start);
          timeCursor < end;
          timeCursor.setMinutes(timeCursor.getMinutes() + slotInterval)
        ) {
          const isoLocal = new Date(timeCursor.getTime() - timeCursor.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          const timeOnly = isoLocal.slice(11, 16);
          if (!occupied.includes(isoLocal)) {
            slots.push(timeOnly);
          }
        }
        setRescheduleTimeSlots(slots);
        if (!slots.includes(rescheduleSelectedSlot)) {
          setRescheduleSelectedSlot("");
        }
      } catch (error) {
        show(
          "Unable to load reschedule availability.",
          "error"
        );
        setRescheduleTimeSlots([]);
      } finally {
        setRescheduleSlotsLoading(false);
      }
    };

    loadRescheduleSlots();
  }, [
    rescheduleClinic,
    rescheduleDoctor,
    rescheduleSelectedDate,
    clinics,
    rescheduleSelectedSlot,
    show,
  ]);

  const fetchMedicalRecords = async () => {
    if (!patientId) return;
    try {
      setMedicalLoading(true);
      const res = await patientAPI.medicalRecords(patientId);
      setMedicalRecords(res.data || []);
    } catch (error) {
      show("Unable to load medical history.", "error");
    } finally {
      setMedicalLoading(false);
    }
  };

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    if (!selectedClinic || !selectedDoctor || !selectedSlot) {
      show("Please complete all booking details.", "error");
      return;
    }
    try {
      const combined = new Date(`${selectedDate}T${selectedSlot}:00`);
      const iso = combined.toISOString();
      await appointmentAPI.book(patientId, {
        clinicId: Number(selectedClinic),
        doctorId: Number(selectedDoctor),
        dateTime: iso,
      });
      show("Appointment booked successfully.", "success");
      refreshAppointments();
      setSelectedClinic("");
      setSelectedDoctor("");
      setSelectedSlot("");
    } catch (error) {
      show(
        "Unable to book appointment.",
        "error"
      );
    }
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      await queueAPI.checkIn(appointmentId);
      show("Checked in successfully. Track your queue status below.", "success");
      setCheckedInAppointmentId(appointmentId);
      await fetchQueueStatus();
      refreshAppointments();
    } catch (error) {
      show(error?.userMessage || error.response?.data?.message || "Unable to check in.", "error");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.cancel(appointmentId);
      show("Appointment cancelled.", "success");
      refreshAppointments();
    } catch (error) {
      show(
        "Unable to cancel appointment.",
        "error"
      );
    }
  };

  const startReschedule = (appointment) => {
    const now = new Date();
    const appointmentDate = new Date(appointment.dateTime);
    const msDiff = appointmentDate.getTime() - now.getTime();
    if (msDiff < 24 * 60 * 60 * 1000) {
      show("Rescheduling is allowed only more than 24 hours before the appointment.", "error");
      return;
    }

    setRescheduleTarget(appointment);
    setRescheduleClinic(String(appointment.clinicId));
    setRescheduleDoctor(String(appointment.doctorId));
    const local = toLocalInputValue(appointment.dateTime);
    setRescheduleSelectedDate(local.slice(0, 10));
    setRescheduleSelectedSlot(local.slice(11, 16));
  };

  const cancelReschedule = () => {
    setRescheduleTarget(null);
    setRescheduleClinic("");
    setRescheduleDoctor("");
    setRescheduleSelectedDate("");
    setRescheduleSelectedSlot("");
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
      show("Please fill in the new appointment details.", "error");
      return;
    }
    try {
      const now = new Date();
      const appointmentDate = new Date(rescheduleTarget.dateTime);
      const msDiff = appointmentDate.getTime() - now.getTime();
      if (msDiff < 24 * 60 * 60 * 1000) {
        show("Rescheduling is allowed only more than 24 hours before the appointment.", "error");
        return;
      }
      const combined = new Date(`${rescheduleSelectedDate}T${rescheduleSelectedSlot}:00`);
      const iso = combined.toISOString();
      await appointmentAPI.reschedule(rescheduleTarget.id, {
        clinicId: Number(rescheduleClinic),
        doctorId: Number(rescheduleDoctor),
        dateTime: iso,
      });
      show("Appointment rescheduled.", "success");
      cancelReschedule();
      refreshAppointments();
    } catch (error) {
      show(
        "Unable to reschedule appointment.",
        "error"
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
        "No active queue status found.",
        "info"
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
    if (!status) return "UNKNOWN";
    switch (String(status).toUpperCase()) {
      case "WAITING":
        return "Waiting";
      case "CALLED":
        return "Called";
      case "IN_SERVICE":
        return "In Service";
      case "DONE":
        return "Done";
      case "CANCELLED":
        return "Cancelled";
      default:
        return String(status);
    }
  };

  const rescheduleDoctors = useMemo(() => {
    if (!rescheduleClinic) return doctors;
    return doctors.filter((doctor) => doctor.clinicId === Number(rescheduleClinic));
  }, [doctors, rescheduleClinic]);

  const upcomingAppointments = useMemo(() => {
    return (appointments || [])
      .filter((appointment) => appointment.status !== "COMPLETED")
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }, [appointments]);

  const pastAppointments = useMemo(() => {
    return (appointments || [])
      .filter((appointment) => appointment.status === "COMPLETED")
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  }, [appointments]);

  const nextAppointment = upcomingAppointments[0] || null;

  const clinicMap = useMemo(() => {
    const map = new Map();
    clinics.forEach((clinic) => map.set(clinic.id, clinic));
    return map;
  }, [clinics]);

  const doctorMap = useMemo(() => {
    const map = new Map();
    doctors.forEach((doctor) => map.set(doctor.id, doctor));
    return map;
  }, [doctors]);

  const getClinicName = (clinicId) =>
    clinicMap.get(clinicId)?.name || `Clinic #${clinicId}`;

  const getClinicLocation = (clinicId) => {
    const clinic = clinicMap.get(clinicId);
    return clinic?.address || clinic?.location || null;
  };

  const getDoctorName = (doctorId) =>
    doctorMap.get(doctorId)?.fullName || `Doctor #${doctorId}`;

  const appointmentStatusStyles = {
    SCHEDULED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CHECKED_IN: "border-sky-200 bg-sky-50 text-sky-700",
    IN_SERVICE: "border-sky-200 bg-sky-50 text-sky-700",
    COMPLETED: "border-slate-200 bg-slate-100 text-slate-600",
    CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
    NO_SHOW: "border-rose-200 bg-rose-50 text-rose-700",
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
  };

  const formatTime = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const medicalRecordCount = medicalRecords.length;

  const recordByAppointmentId = useMemo(() => {
    const map = new Map();
    medicalRecords.forEach((record) => {
      if (record?.appointmentId != null) {
        map.set(record.appointmentId, record);
      }
    });
    return map;
  }, [medicalRecords]);

  const renderAppointmentActions = (appointment, { compact = false } = {}) => {
    const isScheduled = appointment.status === "SCHEDULED";
    const isCheckedIn =
      appointment.status === "CHECKED_IN" || appointment.id === checkedInAppointmentId;
    const size = compact ? "sm" : "default";

    return (
      <div className={cn("flex flex-wrap gap-2", compact ? "mt-3" : "mt-4")}>
        {isScheduled ? (
          <>
            <Button size={size} className="gap-2" onClick={() => handleCheckIn(appointment.id)}>
              <CheckCircle2 className="h-4 w-4" />
              Check in
            </Button>
            <Button
              size={size}
              variant="outline"
              className="gap-2"
              onClick={() => startReschedule(appointment)}
            >
              <History className="h-4 w-4" />
              Reschedule
            </Button>
            <Button
              size={size}
              variant="ghost"
              className="gap-2 text-rose-600 hover:bg-rose-50"
              onClick={() => handleCancelAppointment(appointment.id)}
            >
              Cancel
            </Button>
          </>
        ) : null}
        {isCheckedIn ? (
          <Button
            size={size}
            variant="secondary"
            className="gap-2"
            onClick={fetchQueueStatus}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh queue
          </Button>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Patient Portal</h1>
              <p className="text-sm text-slate-600 mt-1">
                Welcome back{userName ? `, ${userName}` : ""}
              </p>
            </div>
            <Button
              onClick={() => {
                refreshAppointments();
                fetchMedicalRecords();
              }}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8 -mb-px">
            {[
              { id: "overview", label: "Overview", icon: ActivitySquare },
              { id: "appointments", label: "Appointments", icon: CalendarDays },
              { id: "queue", label: "Queue Status", icon: Users },
              { id: "medical-history", label: "Medical History", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Upcoming Visits"
                value={upcomingAppointments.length}
                icon={CalendarDays}
                color="blue"
              />
              <StatCard
                title="Completed Appointments"
                value={pastAppointments.length}
                icon={History}
                color="green"
              />
              <StatCard
                title="Medical Records"
                value={medicalRecordCount}
                icon={FileText}
                color="purple"
              />
            </div>

            {/* Next Appointment Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Your Next Visit</CardTitle>
                    <CardDescription>
                      Review details and prepare for your appointment
                    </CardDescription>
                  </div>
                  {nextAppointment && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize border",
                        appointmentStatusStyles[nextAppointment.status] ||
                          "border-slate-200 bg-slate-100 text-slate-600"
                      )}
                    >
                      {nextAppointment.status.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {nextAppointment ? (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Date</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatDate(nextAppointment.dateTime)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Time</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatTime(nextAppointment.dateTime)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Clinic</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {getClinicName(nextAppointment.clinicId)}
                            </p>
                            {getClinicLocation(nextAppointment.clinicId) && (
                              <p className="text-xs text-slate-500">
                                {getClinicLocation(nextAppointment.clinicId)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Stethoscope className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Doctor</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {getDoctorName(nextAppointment.doctorId)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {renderAppointmentActions(nextAppointment)}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <CalendarDays className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600 mb-4">No upcoming appointments scheduled</p>
                    <Button onClick={() => setActiveTab("appointments")} className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Book an Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Medical Records */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Medical Records</CardTitle>
                    <CardDescription>Quick access to your latest health information</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("medical-history")}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {medicalRecords.length > 0 ? (
                  <div className="space-y-3">
                    {medicalRecords.slice(0, 3).map((record) => (
                      <Link
                        key={record.id}
                        to={`/medical-records/${record.id}`}
                        className="group block rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-blue-500 hover:shadow-md"
                        state={{ record, patientId }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {record.title || `Record #${record.id}`}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDate(record.updatedAt || record.createdAt || record.recordDate)}
                            </p>
                          </div>
                          <FileText className="h-4 w-4 text-blue-600 opacity-0 transition group-hover:opacity-100" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600">No medical records available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <div className="space-y-6">
            {/* Book Appointment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Book New Appointment</CardTitle>
                <CardDescription>
                  Select a clinic, doctor, and preferred time slot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleBookAppointment}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="clinic">Clinic</Label>
                      <Select
                        id="clinic"
                        value={selectedClinic}
                        onChange={(event) => {
                          setSelectedClinic(event.target.value);
                          setSelectedDoctor("");
                        }}
                        required
                      >
                        <option value="">Choose a clinic...</option>
                        {clinics.map((clinic) => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doctor">Doctor</Label>
                      <Select
                        id="doctor"
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
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="appointment-date">Date</Label>
                      <Input
                        id="appointment-date"
                        type="date"
                        value={selectedDate}
                        onChange={(event) => setSelectedDate(event.target.value)}
                        min={new Date().toISOString().slice(0, 10)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="appointment-slot">Time Slot</Label>
                      {slotsLoading ? (
                        <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                          Checking availability...
                        </div>
                      ) : (
                        <Select
                          id="appointment-slot"
                          value={selectedSlot}
                          onChange={(event) => setSelectedSlot(event.target.value)}
                          required
                          disabled={!timeSlots.length}
                        >
                          <option value="">Choose a time...</option>
                          {timeSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </Select>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Confirm Booking
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Reschedule Form */}
            {rescheduleTarget && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle>Reschedule Appointment #{rescheduleTarget.id}</CardTitle>
                  <CardDescription>
                    Select a new time slot (changes allowed up to 24 hours before appointment)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={handleRescheduleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="reschedule-clinic">Clinic</Label>
                        <Select
                          id="reschedule-clinic"
                          value={rescheduleClinic}
                          onChange={(event) => {
                            setRescheduleClinic(event.target.value);
                            setRescheduleDoctor("");
                          }}
                          required
                        >
                          <option value="">Choose a clinic...</option>
                          {clinics.map((clinic) => (
                            <option key={clinic.id} value={clinic.id}>
                              {clinic.name}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reschedule-doctor">Doctor</Label>
                        <Select
                          id="reschedule-doctor"
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
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reschedule-date">New Date</Label>
                        <Input
                          id="reschedule-date"
                          type="date"
                          value={rescheduleSelectedDate}
                          onChange={(event) => setRescheduleSelectedDate(event.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reschedule-slot">New Time Slot</Label>
                        {rescheduleSlotsLoading ? (
                          <div className="flex h-10 items-center rounded-lg border border-dashed border-blue-300 bg-blue-100 px-3 text-sm text-blue-700">
                            Checking availability...
                          </div>
                        ) : (
                          <Select
                            id="reschedule-slot"
                            value={rescheduleSelectedSlot}
                            onChange={(event) => setRescheduleSelectedSlot(event.target.value)}
                            required
                            disabled={!rescheduleSelectedDate}
                          >
                            <option value="">Choose a time...</option>
                            {rescheduleTimeSlots.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelReschedule}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription>
                      Total: {upcomingAppointments.length} scheduled visits
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={refreshAppointments}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-slate-900">
                              {formatDateTime(appointment.dateTime)}
                            </p>
                            <p className="text-sm text-slate-600">
                              {getClinicName(appointment.clinicId)} · {getDoctorName(appointment.doctorId)}
                            </p>
                            {getClinicLocation(appointment.clinicId) && (
                              <p className="text-xs text-slate-500">
                                📍 {getClinicLocation(appointment.clinicId)}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize border self-start",
                              appointmentStatusStyles[appointment.status] ||
                                "border-slate-200 bg-slate-100 text-slate-600"
                            )}
                          >
                            {appointment.status.replace(/_/g, " ").toLowerCase()}
                          </Badge>
                        </div>
                        {renderAppointmentActions(appointment, { compact: true })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <CalendarDays className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600">No upcoming appointments scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Past Appointments</CardTitle>
                <CardDescription>
                  Total: {pastAppointments.length} completed visits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pastAppointments.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Clinic</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Medical Record</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastAppointments.map((appointment) => {
                          const relatedRecord = recordByAppointmentId.get(appointment.id);
                          return (
                            <TableRow key={appointment.id}>
                              <TableCell className="font-medium">
                                {formatDateTime(appointment.dateTime)}
                              </TableCell>
                              <TableCell>{getClinicName(appointment.clinicId)}</TableCell>
                              <TableCell>{getDoctorName(appointment.doctorId)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "capitalize border",
                                    appointmentStatusStyles[appointment.status]
                                  )}
                                >
                                  {appointment.status.replace(/_/g, " ").toLowerCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {relatedRecord ? (
                                  <Link
                                    className="text-sm font-medium text-blue-600 hover:underline"
                                    to={`/medical-records/${relatedRecord.id}`}
                                    state={{ record: relatedRecord, patientId }}
                                  >
                                    View Record
                                  </Link>
                                ) : (
                                  <span className="text-sm text-slate-400">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <History className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600">No appointment history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Queue Status Tab */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Queue Status Tracker</CardTitle>
                    <CardDescription>
                      Real-time updates on your position in the clinic queue
                    </CardDescription>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={fetchQueueStatus}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh Status
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {checkedInAppointmentId ? (
                  <>
                    <Alert className="mb-6 border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-900">Checked In</AlertTitle>
                      <AlertDescription className="text-blue-800">
                        You are currently checked in for appointment #{checkedInAppointmentId}.
                        Queue updates will appear below.
                      </AlertDescription>
                    </Alert>

                    {queueStatus ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                            Your Queue Number
                          </p>
                          <p className="text-4xl font-bold text-blue-600">
                            {queueStatus.queueNumber ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                            Now Serving
                          </p>
                          <p className="text-4xl font-bold text-green-600">
                            {queueStatus.currentNumber ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                            Numbers Away
                          </p>
                          <p className="text-4xl font-bold text-orange-600">
                            {queueStatus.numbersAway ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                            Status
                          </p>
                          <p className="text-2xl font-bold text-slate-900">
                            {mapQueueStatusLabel(queueStatus.status)}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            State: {queueStatus.state ?? "—"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Alert variant="default" className="border-dashed">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Queue Data Yet</AlertTitle>
                        <AlertDescription>
                          Check-ins can take a couple of minutes to process. Please refresh to see
                          updates.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                    <Users className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Not Checked In
                    </h3>
                    <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
                      You need to check in for an upcoming appointment to see your queue status.
                      Go to the Appointments tab and check in when you arrive at the clinic.
                    </p>
                    <Button onClick={() => setActiveTab("appointments")} className="gap-2">
                      <CalendarDays className="h-4 w-4" />
                      View Appointments
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Queue Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>How the Queue Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Check In on Arrival</p>
                      <p className="text-sm text-slate-600">
                        When you arrive at the clinic, use the "Check In" button on your scheduled
                        appointment to join the queue.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Track Your Position</p>
                      <p className="text-sm text-slate-600">
                        Monitor real-time updates showing how many patients are ahead of you and
                        the current number being served.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Get Notified</p>
                      <p className="text-sm text-slate-600">
                        Receive SMS or email notifications when you're 3 numbers away and when it's
                        your turn to see the doctor.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Medical History Tab */}
        {activeTab === "medical-history" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Medical Records</CardTitle>
                    <CardDescription>
                      Access your complete medical history and treatment records
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={fetchMedicalRecords}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {medicalLoading ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
                    <p className="text-sm text-slate-600">Loading medical records...</p>
                  </div>
                ) : medicalRecords.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {medicalRecords.map((record) => (
                      <Link
                        key={record.id}
                        to={`/medical-records/${record.id}`}
                        className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md"
                        state={{ record, patientId }}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <Badge variant="outline" className="text-xs">
                            #{record.id}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 mb-1">
                          {record.title || `Medical Record #${record.id}`}
                        </p>
                        <p className="text-xs text-slate-500 mb-3">
                          {formatDate(record.updatedAt || record.createdAt || record.recordDate)}
                        </p>
                        {record.diagnosis && (
                          <p className="text-sm text-slate-600 mb-1">
                            <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                          </p>
                        )}
                        {record.treatment && (
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Treatment:</span> {record.treatment}
                          </p>
                        )}
                        <div className="mt-4 flex items-center text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition">
                          View Details →
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                    <FileText className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No Medical Records Yet
                    </h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      Your consultation notes and prescriptions will appear here after your first
                      completed visit with a doctor.
                    </p>
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
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
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
