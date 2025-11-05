/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  Building2,
  Stethoscope,
  RefreshCw,
} from "lucide-react";

import { adminAPI, clinicAPI, doctorAPI, statsAPI } from "../../services/api";
import { useToast } from "../../context/useToast";

import { Button } from "../ui/button";

// Sections
import OverviewSection from "./OverviewSection";
import ClinicsTable from "./clinics/ClinicsTable";
import DoctorsTable from "./doctors/DoctorsTable";
import UserForm from "./users/UserForm";
import UsersTable from "./users/UsersTable";

export default function AdminDashboard() {
  const { show } = useToast();

  // Tabs
  const [activeTab, setActiveTab] = useState("overview");

  // Data
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [users, setUsers] = useState([]);

  // User form
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    role: "PATIENT",
    name: "",
    phone: "",
    clinicId: "",
    doctor: false,
    speciality: "",
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [roleSelections, setRoleSelections] = useState({});

  // Clinic edit
  const [editingClinicId, setEditingClinicId] = useState(null);
  const [clinicForm, setClinicForm] = useState({
    name: "",
    address: "",
    openTime: "",
    closeTime: "",
    slotInterval: "",
  });
  const [savingClinic, setSavingClinic] = useState(false);

  // Doctor schedule edits
  const [doctorEdits, setDoctorEdits] = useState({});
  const [savingDoctorId, setSavingDoctorId] = useState(null);

  // Fetch all
  const refreshAll = useCallback(async () => {
    try {
      const [clinicRes, doctorRes, statsRes, userRes] = await Promise.all([
        clinicAPI.getAll(),
        doctorAPI.getAll(),
        statsAPI.getOverview(),
        adminAPI.listUsers(),
      ]);
      setClinics(clinicRes.data || []);
      setDoctors(doctorRes.data || []);
      setSystemStats(statsRes.data || null);
      setUsers(userRes.data || []);
    } catch (error) {
      show(error?.userMessage || "Unable to load administrator data.", "error");
    }
  }, [show]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setDoctorEdits((prev) => {
      const next = {};
      doctors.forEach((d) => {
        next[d.id] = prev[d.id] ?? d.slotIntervalMinutes ?? "";
      });
      return next;
    });
  }, [doctors]);

  // User management
  const resetUserForm = () => {
    setUserForm({
      email: "",
      password: "",
      role: "PATIENT",
      name: "",
      phone: "",
      clinicId: "",
      doctor: false,
      speciality: "",
    });
    setEditingUserId(null);
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...userForm,
      clinicId: userForm.clinicId ? Number(userForm.clinicId) : null,
      doctor: Boolean(userForm.doctor),
    };
    try {
      if (editingUserId) {
        await adminAPI.updateUser(editingUserId, payload);
        show("User updated.", "success");
      } else {
        await adminAPI.createUser(payload);
        show("User created.", "success");
      }
      resetUserForm();
      refreshAll();
    } catch (error) {
      show(error?.userMessage || "Unable to save user.", "error");
    }
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      email: user.email || "",
      password: "",
      role: user.roles?.[0] || "PATIENT",
      name: user.name || "",
      phone: user.phone || "",
      clinicId: user.staffClinicId || user.doctorClinicId || "",
      doctor: Boolean(user.doctorProfileId),
      speciality: "",
    });
    setActiveTab("users");
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await adminAPI.deleteUser(userId);
      show("User deleted.", "success");
      refreshAll();
    } catch (error) {
      show(error?.userMessage || "Unable to delete user.", "error");
    }
  };

  const handleRoleSelectionChange = (userId, role) => {
    setRoleSelections((prev) => ({ ...prev, [userId]: role }));
  };

  const handleAssignRole = async (userId) => {
    const role = roleSelections[userId];
    if (!role) {
      show("Select a role to assign.", "info");
      return;
    }
    try {
      await adminAPI.assignRole(userId, role);
      show("Role assigned.", "success");
      refreshAll();
    } catch (error) {
      show(error?.userMessage || "Unable to assign role.", "error");
    }
  };

  // Clinic management
  const resetClinicForm = () => {
    setClinicForm({
      name: "",
      address: "",
      openTime: "",
      closeTime: "",
      slotInterval: "",
    });
    setEditingClinicId(null);
  };

  const handleEditClinic = (clinic) => {
    setEditingClinicId(clinic.id);
    setClinicForm({
      name: clinic.name || "",
      address: clinic.address || "",
      openTime: clinic.openTime || "",
      closeTime: clinic.closeTime || "",
      slotInterval:
        clinic.defaultSlotIntervalMinutes != null
          ? String(clinic.defaultSlotIntervalMinutes)
          : "",
    });
  };

  const handleClinicFieldChange = (field, value) => {
    setClinicForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClinicSave = async (event) => {
    event.preventDefault();
    if (!editingClinicId) return;

    const name = clinicForm.name.trim();
    const address = clinicForm.address.trim();
    if (!name || !address) {
      show("Clinic name and address are required.", "error");
      return;
    }

    const slotIntervalValue = clinicForm.slotInterval
      ? parseInt(clinicForm.slotInterval, 10)
      : null;
    if (slotIntervalValue !== null && (Number.isNaN(slotIntervalValue) || slotIntervalValue <= 0)) {
      show("Slot interval must be a positive number.", "error");
      return;
    }

    setSavingClinic(true);
    try {
      const ops = [
        clinicAPI.update(editingClinicId, { name, address }),
        clinicAPI.updateHours(editingClinicId, {
          openTime: clinicForm.openTime || null,
          closeTime: clinicForm.closeTime || null,
        }),
      ];
      if (slotIntervalValue !== null) {
        ops.push(clinicAPI.updateSlotInterval(editingClinicId, slotIntervalValue));
      }
      await Promise.all(ops);
      show("Clinic updated.", "success");
      resetClinicForm();
      refreshAll();
    } catch (error) {
      show(error?.userMessage || "Unable to update clinic.", "error");
    } finally {
      setSavingClinic(false);
    }
  };

  const handleClinicCancel = () => resetClinicForm();

  // Doctor management
  const handleDoctorIntervalChange = (doctorId, value) => {
    setDoctorEdits((prev) => ({ ...prev, [doctorId]: value }));
  };

  const handleDoctorScheduleSave = async (doctorId) => {
    const intervalValue = parseInt(doctorEdits[doctorId], 10);
    if (Number.isNaN(intervalValue) || intervalValue <= 0) {
      show("Provide a positive slot interval (minutes).", "error");
      return;
    }
    setSavingDoctorId(doctorId);
    try {
      await doctorAPI.updateSchedule(doctorId, { slotIntervalMinutes: intervalValue });
      show("Doctor schedule updated.", "success");
      refreshAll();
    } catch (error) {
      show(error?.userMessage || "Unable to update doctor schedule.", "error");
    } finally {
      setSavingDoctorId(null);
    }
  };

  const clinicMap = useMemo(() => {
    const m = new Map();
    clinics.forEach((c) => m.set(c.id, c));
    return m;
  }, [clinics]);

  const getClinicName = (clinicId) =>
    clinicMap.get(clinicId)?.name || (clinicId ? `Clinic #${clinicId}` : "—");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">System Administration</h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage users, clinics, doctors, and monitor system performance
              </p>
            </div>
            <Button onClick={refreshAll} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="flex space-x-8 -mb-px">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "users", label: "User Management", icon: Users },
              { id: "clinics", label: "Clinic Management", icon: Building2 },
              { id: "doctors", label: "Doctor Management", icon: Stethoscope },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    active
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="px-6 py-8">
        {activeTab === "overview" && (
          <OverviewSection
            usersCount={users.length}
            clinicsCount={clinics.length}
            doctorsCount={doctors.length}
            systemStats={systemStats}
            onGoUsers={() => setActiveTab("users")}
            onGoClinics={() => setActiveTab("clinics")}
            onGoDoctors={() => setActiveTab("doctors")}
          />
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <UserForm
              clinics={clinics}
              userForm={userForm}
              setUserForm={setUserForm}
              editingUserId={editingUserId}
              onSubmit={handleUserSubmit}
              onCancel={resetUserForm}
            />
            <UsersTable
              users={users}
              clinics={clinics}
              getClinicName={getClinicName}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              roleSelections={roleSelections}
              onRoleSelectionChange={handleRoleSelectionChange}
              onAssignRole={handleAssignRole}
            />
          </div>
        )}

        {activeTab === "clinics" && (
          <ClinicsTable
            clinics={clinics}
            editingClinicId={editingClinicId}
            clinicForm={clinicForm}
            savingClinic={savingClinic}
            onEditClinic={handleEditClinic}
            onFieldChange={handleClinicFieldChange}
            onSave={handleClinicSave}
            onCancel={handleClinicCancel}
          />
        )}

        {activeTab === "doctors" && (
          <DoctorsTable
            doctors={doctors}
            getClinicName={getClinicName}
            doctorEdits={doctorEdits}
            savingDoctorId={savingDoctorId}
            onIntervalChange={handleDoctorIntervalChange}
            onSaveSchedule={handleDoctorScheduleSave}
          />
        )}
      </div>
    </div>
  );
}
