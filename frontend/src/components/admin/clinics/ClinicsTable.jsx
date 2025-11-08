import { useState } from "react";
import { Building2, Clock, Edit2, MapPin, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import Pagination from "../shared/Pagination";

const PAGE_SIZE = 10;

export default function ClinicsTable({
  clinics,
  editingClinicId,
  clinicForm,
  savingClinic,
  onEditClinic,
  onFieldChange,
  onSave,
  onCancel,
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(clinics.length / PAGE_SIZE) || 1;
  const paginated = clinics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clinic Configuration</CardTitle>
              <CardDescription>Total: {clinics.length} clinics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm text-slate-600">No clinics configured</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clinic Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Operating Hours</TableHead>
                      <TableHead>Slot Interval</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((clinic) => (
                      <TableRow key={clinic.id}>
                        {editingClinicId === clinic.id ? (
                          <TableCell colSpan={5} className="p-6">
                            <form onSubmit={onSave} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="clinic-name">Clinic Name *</Label>
                                  <Input
                                    id="clinic-name"
                                    type="text"
                                    value={clinicForm.name}
                                    onChange={(e) => onFieldChange("name", e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="clinic-address">Address *</Label>
                                  <Input
                                    id="clinic-address"
                                    type="text"
                                    value={clinicForm.address}
                                    onChange={(e) => onFieldChange("address", e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="clinic-open">Open Time</Label>
                                  <Input
                                    id="clinic-open"
                                    type="time"
                                    value={clinicForm.openTime}
                                    onChange={(e) => onFieldChange("openTime", e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="clinic-close">Close Time</Label>
                                  <Input
                                    id="clinic-close"
                                    type="time"
                                    value={clinicForm.closeTime}
                                    onChange={(e) => onFieldChange("closeTime", e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="clinic-interval">Slot Interval (minutes)</Label>
                                  <Input
                                    id="clinic-interval"
                                    type="number"
                                    min="5"
                                    step="5"
                                    value={clinicForm.slotInterval}
                                    onChange={(e) => onFieldChange("slotInterval", e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <Button type="submit" disabled={savingClinic} className="gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {savingClinic ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button type="button" variant="outline" onClick={onCancel} disabled={savingClinic}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </TableCell>
                        ) : (
                          <>
                            <TableCell className="font-medium">{clinic.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                {clinic.address}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock className="h-4 w-4 text-slate-400" />
                                {clinic.openTime || "N/A"} - {clinic.closeTime || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {clinic.defaultSlotIntervalMinutes} mins
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => onEditClinic(clinic)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </>
                        )}
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
