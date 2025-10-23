import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  NotebookPen,
  PencilLine,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { appointmentAPI, doctorAPI, patientAPI } from "../services/api";
import { useToast } from "../context/useToast";
import AuthContext from "../context/AuthContext.jsx";
import { useAuth } from "../context/useAuth";
import { AppShell } from "../components/layout/AppShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

const editableStatuses = ["IN_PROGRESS", "COMPLETED", "SERVED", "CALLED"];

export default function DoctorNotes() {
  const { show } = useToast();
  const { user } = useContext(AuthContext);
  const doctorId = user?.doctorProfileId;
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [originalNotes, setOriginalNotes] = useState("");
  const [filterPatientId, setFilterPatientId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!doctorId) {
        setAppointments([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await appointmentAPI.listForDoctor(doctorId);
        const filtered = (res.data || []).filter((appointment) =>
          editableStatuses.includes(String(appointment.status).toUpperCase())
        );
        setAppointments(filtered);
      } catch (error) {
        show(error?.userMessage || "Unable to load appointments.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [doctorId, show]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (filterPatientId && String(appointment.patientId) !== String(filterPatientId)) {
        return false;
      }
      if (filterDate) {
        const appointmentDate = new Date(appointment.dateTime).toISOString().slice(0, 10);
        if (appointmentDate !== filterDate) return false;
      }
      return true;
    });
  }, [appointments, filterPatientId, filterDate]);

  const startEdit = (appointment) => {
    setSelected(appointment);
    setNotes("");
    setOriginalNotes("");
  };

  useEffect(() => {
    const loadExistingNotes = async () => {
      if (!selected) return;
      try {
        const res = await patientAPI.medicalRecords(selected.patientId);
        const found = (res.data || []).find(
          (record) => Number(record.appointmentId) === Number(selected.id)
        );
        if (found) {
          setNotes(found.notes || "");
          setOriginalNotes(found.notes || "");
        } else {
          setNotes("");
          setOriginalNotes("");
        }
      } catch {
        setNotes("");
        setOriginalNotes("");
      }
    };

    loadExistingNotes();
  }, [selected]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selected) {
      show("Select an appointment first", "error");
      return;
    }
    setSubmitting(true);
    try {
      await doctorAPI.postNotes(doctorId, {
        doctorId: Number(doctorId),
        appointmentId: Number(selected.id),
        notes,
      });
      show("Notes saved.", "success");
      setSelected(null);
      setNotes("");
      const res = await appointmentAPI.listForDoctor(doctorId);
      setAppointments(
        (res.data || []).filter((appointment) =>
          editableStatuses.includes(String(appointment.status).toUpperCase())
        )
      );
    } catch (error) {
      show(error?.userMessage || "Unable to save notes.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const refreshList = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const res = await appointmentAPI.listForDoctor(doctorId);
      setAppointments(
        (res.data || []).filter((appointment) =>
          editableStatuses.includes(String(appointment.status).toUpperCase())
        )
      );
    } catch (error) {
      show(error?.userMessage || "Unable to refresh appointments.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!doctorId) {
    return (
      <Card className="mx-auto mt-10 max-w-xl">
        <CardHeader>
          <CardTitle>Doctor access required</CardTitle>
          <CardDescription>Sign in with a doctor account to manage consultation notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <AppShell user={user} onLogout={logout}>
      <div className="space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Appointments ready for notes
                </CardTitle>
                <CardDescription>
                  Filter by patient or date, then select a consultation to add notes.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={refreshList}>
                <RefreshCw className="h-4 w-4" />
                Refresh list
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="filter-patient">Filter by patient ID</Label>
                  <Input
                    id="filter-patient"
                    type="number"
                    inputMode="numeric"
                    value={filterPatientId}
                    onChange={(event) => setFilterPatientId(event.target.value)}
                    placeholder="e.g. 12045"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filter-date">Filter by date</Label>
                  <Input
                    id="filter-date"
                    type="date"
                    value={filterDate}
                    onChange={(event) => setFilterDate(event.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading appointments...</p>
              ) : filteredAppointments.length === 0 ? (
                <Alert variant="default" className="border border-dashed border-slate-300 bg-slate-50">
                  <AlertTitle>No appointments match your filters</AlertTitle>
                  <AlertDescription>
                    Try adjusting the patient ID or date to find the consultation you want to update.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">
                          {new Date(appointment.dateTime).toLocaleString()}
                        </p>
                        <p>Patient #{appointment.patientId}</p>
                        <Badge variant="secondary" className="capitalize">
                          {String(appointment.status).replace(/_/g, " ").toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="gap-2"
                          onClick={() => startEdit(appointment)}
                        >
                          <PencilLine className="h-4 w-4" />
                          Add / edit notes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5 text-primary" />
                Notes editor
              </CardTitle>
              <CardDescription>
                {selected
                  ? `Editing appointment #${selected.id} for patient #${selected.patientId}`
                  : "Choose an appointment to add or update notes."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selected ? (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">
                      {new Date(selected.dateTime).toLocaleString()}
                    </p>
                    <p>Patient #{selected.patientId}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doctor-notes">Consultation notes</Label>
                    <Textarea
                      id="doctor-notes"
                      rows={10}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Summarise your findings, diagnosis, and recommended follow-up."
                    />
                    <p className="text-xs text-muted-foreground">{notes.length} characters</p>
                  </div>

                  {originalNotes && originalNotes !== notes ? (
                    <Alert variant="default" className="border border-dashed border-slate-200 bg-slate-50">
                      <AlertTitle>Previously recorded notes</AlertTitle>
                      <AlertDescription className="text-sm text-slate-700">
                        {originalNotes.slice(0, 300)}
                        {originalNotes.length > 300 ? "…" : ""}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="submit"
                      className="gap-2"
                      disabled={submitting || notes === originalNotes}
                    >
                      {submitting ? "Saving..." : notes === originalNotes ? "No changes" : "Save notes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelected(null);
                        setNotes("");
                        setOriginalNotes("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select an appointment on the left to start adding clinical notes.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
