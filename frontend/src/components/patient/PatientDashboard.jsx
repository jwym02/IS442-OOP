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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { cn } from "../../lib/utils";

export default function PatientDashboard({ patientId, userName }) {
  const { show } = useToast();
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
        show(error?.response?.data?.message || "Unable to load patient dashboard data.", "error");
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
      show(error?.userMessage || "Unable to refresh appointments.", "error");
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
          error?.userMessage || error?.response?.data?.message || "Unable to load available slots.",
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
          error?.userMessage ||
            error?.response?.data?.message ||
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
      show(error?.response?.data?.message || "Unable to load medical history.", "error");
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
        error?.userMessage || error?.response?.data?.message || "Unable to book appointment.",
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
        error?.userMessage || error.response?.data?.message || "Unable to cancel appointment.",
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
        error?.userMessage ||
          error?.response?.data?.message ||
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
        error?.userMessage || error.response?.data?.message || "No active queue status found.",
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
      <Card className="border-dashed border-slate-200 bg-white/70 shadow-none">
        <CardContent className="flex h-60 items-center justify-center text-sm text-muted-foreground">
          Loading your personalised dashboard...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary via-primary/90 to-indigo-600 text-primary-foreground shadow-xl">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/80">
              Welcome back{userName ? `, ${userName}` : ""}
            </p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Your care is on schedule.</h2>
            <p className="mt-4 max-w-xl text-sm text-primary-foreground/80">
              Track appointments, reschedule when needed, and get live queue updates straight from
              the clinic.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-white/15 p-4 text-sm sm:text-right">
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="text-primary-foreground/80">Upcoming visits</span>
              <span className="text-2xl font-semibold">{upcomingAppointments.length}</span>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="text-primary-foreground/80">Medical records</span>
              <span className="text-2xl font-semibold">{medicalRecordCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Your next visit</CardTitle>
              <CardDescription>
                Review the details and confirm you are ready for the clinic.
              </CardDescription>
            </div>
            {nextAppointment ? (
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
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6">
            {nextAppointment ? (
              <>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-5 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatDate(nextAppointment.dateTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Time</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatTime(nextAppointment.dateTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Clinic
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {getClinicName(nextAppointment.clinicId)}
                        </p>
                        {getClinicLocation(nextAppointment.clinicId) ? (
                          <p className="text-xs text-muted-foreground">
                            {getClinicLocation(nextAppointment.clinicId)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Doctor
                        </p>
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
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-muted-foreground">
                You have no upcoming appointments. Book a visit to get started.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Health summary</CardTitle>
            <CardDescription>At-a-glance metrics across your clinic activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Upcoming visits</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {upcomingAppointments.length}
                  </p>
                </div>
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Visits completed</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {pastAppointments.length}
                  </p>
                </div>
                <History className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Medical documents</p>
                  <p className="text-2xl font-semibold text-slate-900">{medicalRecordCount}</p>
                </div>
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {checkedInAppointmentId ? (
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Queue updates</CardTitle>
              <CardDescription>
                Tracking appointment #{checkedInAppointmentId}. Refresh to pull the latest call.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={fetchQueueStatus}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {queueStatus ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase text-muted-foreground">Your number</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {queueStatus.queueNumber ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase text-muted-foreground">Now serving</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {queueStatus.currentNumber ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase text-muted-foreground">Numbers away</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {queueStatus.numbersAway ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase text-muted-foreground">Status</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {mapQueueStatusLabel(queueStatus.status)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Queue state: {queueStatus.state ?? "—"}
                  </p>
                </div>
              </div>
            ) : (
              <Alert variant="default" className="border border-dashed border-slate-300 bg-slate-50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No queue data yet</AlertTitle>
                <AlertDescription>
                  Check-ins can take a couple of minutes to appear. Try refreshing again shortly.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>Manage upcoming visits or review your history.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-2" onClick={refreshAppointments}>
            <RefreshCw className="h-4 w-4" />
            Refresh list
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingAppointments.length ? (
                upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {formatDateTime(appointment.dateTime)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getClinicName(appointment.clinicId)} · {getDoctorName(appointment.doctorId)}
                        </p>
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
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-muted-foreground">
                  No future visits booked just yet.
                </div>
              )}
            </TabsContent>
            <TabsContent value="history">
              {pastAppointments.length ? (
                <div className="rounded-xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Clinic</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Record</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastAppointments.map((appointment) => {
                        const relatedRecord = recordByAppointmentId.get(appointment.id);
                        return (
                          <TableRow key={appointment.id}>
                            <TableCell>{formatDateTime(appointment.dateTime)}</TableCell>
                            <TableCell>{getClinicName(appointment.clinicId)}</TableCell>
                            <TableCell>{getDoctorName(appointment.doctorId)}</TableCell>
                            <TableCell className="capitalize">
                              {appointment.status.replace(/_/g, " ").toLowerCase()}
                            </TableCell>
                            <TableCell className="text-right">
                              {relatedRecord ? (
                                <Link
                                  className="text-sm font-medium text-primary hover:underline"
                                  to={`/medical-records/${relatedRecord.id}`}
                                  state={{ record: relatedRecord, patientId }}
                                >
                                  View record
                                </Link>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-muted-foreground">
                  Completed visits will appear here.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Book a new appointment</CardTitle>
            <CardDescription>
              Choose a clinic and a doctor to find the best available time slot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleBookAppointment}>
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="appointment-slot">Time slot</Label>
                  {slotsLoading ? (
                    <div className="flex h-10 items-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 text-sm text-muted-foreground">
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
                Confirm booking
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Medical records</CardTitle>
              <CardDescription>Review previous notes and prescriptions.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-2" onClick={fetchMedicalRecords}>
              <RefreshCw className="h-4 w-4" />
              Refresh records
            </Button>
          </CardHeader>
          <CardContent>
            {medicalLoading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-muted-foreground">
                Fetching your medical history...
              </div>
            ) : medicalRecords.length ? (
              <div className="space-y-3">
                {medicalRecords.map((record) => (
                  <Link
                    key={record.id}
                    to={`/medical-records/${record.id}`}
                    className="group block rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-primary hover:shadow-md"
                    state={{ record, patientId }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {record.title || `Record #${record.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDate(record.updatedAt || record.createdAt || record.recordDate)}
                        </p>
                      </div>
                      <FileText className="h-4 w-4 text-primary opacity-0 transition group-hover:opacity-100" />
                    </div>
                    {record.diagnosis ? (
                      <p className="mt-3 text-sm text-slate-600">Diagnosis: {record.diagnosis}</p>
                    ) : null}
                    {record.treatment ? (
                      <p className="mt-1 text-sm text-slate-600">Treatment: {record.treatment}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-muted-foreground">
                You&apos;ll see your consultation notes and prescriptions after your first visit.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {rescheduleTarget ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Reschedule appointment #{rescheduleTarget.id}</CardTitle>
            <CardDescription>
              Select a new time slot. Changes are allowed up to 24 hours before the visit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleRescheduleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Label htmlFor="reschedule-date">New date</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleSelectedDate}
                    onChange={(event) => setRescheduleSelectedDate(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reschedule-slot">New time slot</Label>
                  {rescheduleSlotsLoading ? (
                    <div className="flex h-10 items-center rounded-md border border-dashed border-primary/40 bg-primary/10 px-3 text-sm text-primary">
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

              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2"
                  onClick={cancelReschedule}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
