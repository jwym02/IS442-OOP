import { UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select } from "../../ui/select";

export default function UserForm({
  clinics,
  userForm,
  setUserForm,
  editingUserId,
  onSubmit,
  onCancel,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingUserId ? "Edit User" : "Create New User"}</CardTitle>
        <CardDescription>
          {editingUserId
            ? "Update user information and permissions"
            : "Add a new user to the system with role assignment"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="user-email">Email Address <span className="text-red-500">*</span></Label>
              <Input
                id="user-email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">
                Password {editingUserId ? "(leave blank to keep current)" : <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                required={!editingUserId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="user-name"
                type="text"
                value={userForm.name}
                onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-phone">Phone Number</Label>
              <Input
                id="user-phone"
                type="tel"
                value={userForm.phone}
                onChange={(e) => setUserForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">Role <span className="text-red-500">*</span></Label>
              <Select
                id="user-role"
                value={userForm.role}
                onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                required
                disabled={!!editingUserId}
              >
                <option value="PATIENT">Patient</option>
                <option value="CLINIC_STAFF">Clinic Staff</option>
                {/* <option value="SYSTEM_ADMINISTRATOR">System Administrator</option> */}
              </Select>
              {editingUserId && (
                <p className="text-xs text-slate-500 mt-1">
                  Role cannot be changed when editing a user
                </p>
              )}
            </div>

            {userForm.role === "CLINIC_STAFF" && (
              <div className="space-y-2">
                <Label htmlFor="user-clinic">Assigned Clinic</Label>
                <Select
                  id="user-clinic"
                  value={userForm.clinicId}
                  onChange={(e) => setUserForm((p) => ({ ...p, clinicId: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {userForm.role === "CLINIC_STAFF" && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="user-doctor"
                checked={userForm.doctor}
                onChange={(e) => setUserForm((p) => ({ ...p, doctor: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="user-doctor" className="ml-2 text-sm text-slate-700">
                Create doctor profile for this user
              </label>
            </div>
          )}

          {(userForm.role === "CLINIC_STAFF" && userForm.doctor) && (
            <div className="space-y-2">
              <Label htmlFor="user-specialty">Medical Specialty</Label>
              <Input
                id="user-specialty"
                type="text"
                value={userForm.specialty}
                onChange={(e) => setUserForm((p) => ({ ...p, specialty: e.target.value }))}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="gap-2">
              <UserPlus className="h-4 w-4" />
              {editingUserId ? "Update User" : "Create User"}
            </Button>
            {editingUserId && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}