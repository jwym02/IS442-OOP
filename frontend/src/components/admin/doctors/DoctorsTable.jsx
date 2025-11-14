import { useState } from "react";
import { Stethoscope } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import Pagination from "../shared/Pagination";

const PAGE_SIZE = 10;

export default function DoctorsTable({
  doctors,
  getClinicName,
  doctorEdits,
  savingDoctorId,
  onIntervalChange,
  onSaveSchedule,
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(doctors.length / PAGE_SIZE) || 1;
  const paginated = doctors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  console.log(paginated)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Schedule Management</CardTitle>
          <CardDescription>
            Configure appointment slot intervals for each doctor (Total: {doctors.length} doctors)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <Stethoscope className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm text-slate-600">No doctors registered</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor Name</TableHead>
                      <TableHead>Assigned Clinic</TableHead>
                      <TableHead>Current Slot Interval</TableHead>
                      <TableHead className="text-right">Update Schedule</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-blue-600" />
                            {doctor.fullName || `Doctor #${doctor.id}`}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {doctor.clinicId ? getClinicName(doctor.clinicId) : "Unassigned"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {doctor.slotIntervalMinutes ? `${doctor.slotIntervalMinutes} minutes` : "Not set"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Input
                              type="number"
                              min="5"
                              step="5"
                              value={doctorEdits[doctor.id] ?? ""}
                              onChange={(e) => onIntervalChange(doctor.id, e.target.value)}
                              placeholder=""
                              className="w-24 text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => onSaveSchedule(doctor.id)}
                              disabled={savingDoctorId === doctor.id}
                            >
                              {savingDoctorId === doctor.id ? "Saving..." : "Update"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
