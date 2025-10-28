import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { patientAPI } from "../services/api";
import { useToast } from "../context/useToast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

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

  if (loading) {
    return (
      <Card className="mx-auto max-w-3xl border-dashed border-slate-200 bg-white/80 shadow-none">
        <CardContent className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          Loading medical record...
        </CardContent>
      </Card>
    );
  }

  if (!record) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Medical record not found</CardTitle>
          <CardDescription>
            We couldn&apos;t locate the record you were looking for. It might have been archived or
            removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-5 w-5 text-primary" />
            Medical record detail
          </CardTitle>
          <CardDescription>
            {record.recordDate
              ? `Updated on ${new Date(record.recordDate).toLocaleString()}`
              : "Recorded date unavailable"}
          </CardDescription>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-700">
        {record.clinicName ? (
          <div>
            <p className="text-xs uppercase text-muted-foreground">Clinic</p>
            <p className="text-base font-medium text-slate-900">{record.clinicName}</p>
          </div>
        ) : null}

        {record.doctorName ? (
          <div>
            <p className="text-xs uppercase text-muted-foreground">Doctor</p>
            <p className="text-base font-medium text-slate-900">{record.doctorName}</p>
          </div>
        ) : null}

        {record.diagnosis ? (
          <div>
            <p className="text-xs uppercase text-muted-foreground">Diagnosis</p>
            <p className="text-base font-medium text-slate-900">{record.diagnosis}</p>
          </div>
        ) : null}

        {record.treatment ? (
          <div>
            <p className="text-xs uppercase text-muted-foreground">Treatment</p>
            <p className="text-base font-medium text-slate-900">{record.treatment}</p>
          </div>
        ) : null}

        {record.notes ? (
          <div>
            <p className="text-xs uppercase text-muted-foreground">Doctor&apos;s notes</p>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
              {record.notes}
            </pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
