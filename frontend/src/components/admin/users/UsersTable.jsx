import { useMemo, useState } from "react";
import { Edit2, Shield, Trash2, Users, X } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import Pagination from "../shared/Pagination";
import { cn } from "../../../lib/utils";

const PAGE_SIZE = 10;

function getRoleBadgeColor(role) {
  switch (role) {
    case "SYSTEM_ADMINISTRATOR":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "CLINIC_STAFF":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "PATIENT":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export default function UsersTable({
  users,
  clinics,
  getClinicName,
  onEditUser,
  onDeleteUser,
  roleSelections,
  onRoleSelectionChange,
  onAssignRole,
  onRemoveRole,
}) {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!term.trim()) return users;
    const q = term.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.roles?.some((r) => r.toLowerCase().includes(q))
    );
  }, [users, term]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Total: {users.length} users ({filtered.length} displayed)
            </CardDescription>
          </div>
          <div className="w-64">
            <Input
              type="text"
              placeholder="Search users..."
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-sm text-slate-600">
              {term ? "No users found matching your search" : "No users registered yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Assign Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                      <TableCell className="text-sm text-slate-600">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.length ? (
                            user.roles.map((role, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={cn("text-xs capitalize border group relative", getRoleBadgeColor(role))}
                              >
                                {role.replace(/_/g, " ").toLowerCase()}
                                {user.roles.length > 1 && (
                                  <button
                                    onClick={() => onRemoveRole(user.id, role)}
                                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-full hover:bg-black/10 w-4 h-4"
                                    title="Remove this role"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {user.staffClinicId || user.doctorClinicId
                          ? getClinicName(user.staffClinicId || user.doctorClinicId)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={roleSelections[user.id] || ""}
                            onChange={(e) => onRoleSelectionChange(user.id, e.target.value)}
                            className="text-sm w-40"
                          >
                            <option value="">Select role...</option>
                            <option value="PATIENT">Patient</option>
                            <option value="CLINIC_STAFF">Clinic Staff</option>
                            <option value="SYSTEM_ADMINISTRATOR">System Administrator</option>
                          </Select>
                          <Button size="sm" variant="outline" onClick={() => onAssignRole(user.id)}>
                            <Shield className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => onEditUser(user)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => onDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
  );
}
