/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  Building2,
  Stethoscope,
  Settings,
  RefreshCw,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { adminAPI, clinicAPI, doctorAPI, statsAPI } from '../../services/api';
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

export default function AdminDashboard() {
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'PATIENT',
    name: '',
    phone: '',
    clinicId: '',
    doctor: false,
    speciality: '',
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [roleSelections, setRoleSelections] = useState({});
  const [roleGroupSelections, setRoleGroupSelections] = useState({});
  const [allowedRolesMap, setAllowedRolesMap] = useState({});
  const [editingClinicId, setEditingClinicId] = useState(null);
  const [clinicForm, setClinicForm] = useState({
    name: '',
    address: '',
    openTime: '',
    closeTime: '',
    slotInterval: '',
  });
  const [savingClinic, setSavingClinic] = useState(false);
  const [doctorEdits, setDoctorEdits] = useState({});
  const [savingDoctorId, setSavingDoctorId] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [clinicPage, setClinicPage] = useState(1);
  const [doctorPage, setDoctorPage] = useState(1);
  const itemsPerPage = 10;

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
      show(error?.userMessage || 'Unable to load administrator data.', 'error');
    }
  }, [show]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setDoctorEdits((prev) => {
      const next = {};
      doctors.forEach((doctor) => {
        next[doctor.id] = prev[doctor.id] ?? doctor.slotIntervalMinutes ?? '';
      });
      return next;
    });
  }, [doctors]);

  const resetUserForm = () => {
    setUserForm({
      email: '',
      password: '',
      role: 'PATIENT',
      name: '',
      phone: '',
      clinicId: '',
      doctor: false,
      speciality: '',
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
        show('User updated.', 'success');
      } else {
        await adminAPI.createUser(payload);
        show('User created.', 'success');
      }
      resetUserForm();
      refreshAll();
    } catch (error) {
      show(error?.userMessage || 'Unable to save user.', 'error');
    }
  };

  const handleEditUser = (user) => {
    console.log(user);
    setEditingUserId(user.id);
    setUserForm({
      email: user.email || '',
      password: '',
      role: user.roles?.[0] || 'PATIENT',
      name: user.name || '',
      phone: user.phone || '',
      clinicId: user.staffClinicId || user.doctorClinicId || '',
      doctor: Boolean(user.doctorProfileId),
      speciality: user.speciality || user.medicalSpeciality || '',
    });
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm('Are you sure you want to delete this user? This action cannot be undone.')
    ) {
      return;
    }
    try {
      await adminAPI.deleteUser(userId);
      show('User deleted.', 'success');
      refreshAll();
    } catch (error) {
      show(error?.userMessage || 'Unable to delete user.', 'error');
    }
  };

  const handleRoleSelectionChange = (userId, role) => {
    setRoleSelections((prev) => ({ ...prev, [userId]: role }));
  };

  const handleAssignRole = async (userId) => {
    const role = roleSelections[userId];
    if (!role) {
      show('Select a role to assign.', 'info');
      return;
    }
    try {
      await adminAPI.assignRole(userId, role);
      show('Role assigned.', 'success');
      refreshAll();
    } catch (error) {
      show(error?.userMessage || 'Unable to assign role.', 'error');
    }
  };

  const resetClinicForm = () => {
    setClinicForm({
      name: '',
      address: '',
      openTime: '',
      closeTime: '',
      slotInterval: '',
    });
    setEditingClinicId(null);
  };

  const handleEditClinic = (clinic) => {
    setEditingClinicId(clinic.id);
    setClinicForm({
      name: clinic.name || '',
      address: clinic.address || '',
      openTime: clinic.openTime || '',
      closeTime: clinic.closeTime || '',
      slotInterval:
        clinic.defaultSlotIntervalMinutes != null ? String(clinic.defaultSlotIntervalMinutes) : '',
    });
  };

  const handleClinicFieldChange = (field, value) => {
    setClinicForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClinicSave = async (event) => {
    event.preventDefault();
    if (!editingClinicId) {
      return;
    }

    const trimmedName = clinicForm.name.trim();
    const trimmedAddress = clinicForm.address.trim();
    if (!trimmedName || !trimmedAddress) {
      show('Clinic name and address are required.', 'error');
      return;
    }

    const slotIntervalValue = clinicForm.slotInterval
      ? parseInt(clinicForm.slotInterval, 10)
      : null;
    if (slotIntervalValue !== null && (Number.isNaN(slotIntervalValue) || slotIntervalValue <= 0)) {
      show('Slot interval must be a positive number.', 'error');
      return;
    }

    setSavingClinic(true);
    try {
      const updates = [
        clinicAPI.update(editingClinicId, { name: trimmedName, address: trimmedAddress }),
        clinicAPI.updateHours(editingClinicId, {
          openTime: clinicForm.openTime || null,
          closeTime: clinicForm.closeTime || null,
        }),
      ];
      if (slotIntervalValue !== null) {
        updates.push(clinicAPI.updateSlotInterval(editingClinicId, slotIntervalValue));
      }
      await Promise.all(updates);
      show('Clinic updated.', 'success');
      resetClinicForm();
      refreshAll();
    } catch (error) {
      show(error?.userMessage || 'Unable to update clinic.', 'error');
    } finally {
      setSavingClinic(false);
    }
  };

  const handleClinicCancel = () => {
    resetClinicForm();
  };

  const handleDoctorIntervalChange = (doctorId, value) => {
    setDoctorEdits((prev) => ({ ...prev, [doctorId]: value }));
  };

  const handleDoctorScheduleSave = async (doctorId) => {
    const intervalValue = parseInt(doctorEdits[doctorId], 10);
    if (Number.isNaN(intervalValue) || intervalValue <= 0) {
      show('Provide a positive slot interval in minutes.', 'error');
      return;
    }
    setSavingDoctorId(doctorId);
    try {
      await doctorAPI.updateSchedule(doctorId, { slotIntervalMinutes: intervalValue });
      show('Doctor schedule updated.', 'success');
      refreshAll();
    } catch (error) {
      show(error?.userMessage || 'Unable to update doctor schedule.', 'error');
    } finally {
      setSavingDoctorId(null);
    }
  };

  // Pagination and search
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return users;
    const term = userSearchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.roles?.some((role) => role.toLowerCase().includes(term))
    );
  }, [users, userSearchTerm]);

  const getPaginatedItems = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (items) => Math.ceil(items.length / itemsPerPage);

  const paginatedUsers = getPaginatedItems(filteredUsers, userPage);
  const paginatedClinics = getPaginatedItems(clinics, clinicPage);
  const paginatedDoctors = getPaginatedItems(doctors, doctorPage);

  const totalUserPages = getTotalPages(filteredUsers);
  const totalClinicPages = getTotalPages(clinics);
  const totalDoctorPages = getTotalPages(doctors);

  const formatDateTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SYSTEM_ADMINISTRATOR':
        return 'border-purple-200 bg-purple-50 text-purple-700';
      case 'CLINIC_STAFF':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'PATIENT':
        return 'border-slate-200 bg-slate-100 text-slate-600';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  };

  const clinicMap = useMemo(() => {
    const map = new Map();
    clinics.forEach((clinic) => map.set(clinic.id, clinic));
    return map;
  }, [clinics]);

  const getClinicName = (clinicId) => clinicMap.get(clinicId)?.name || `Clinic #${clinicId}`;

  const parsedQueueStats = useMemo(() => {
    try {
      if (!systemStats?.queueStatistics) return { served: 0, called: 0, waiting: 0 };
      const match = systemStats.queueStatistics.match(/SERVED=(\d+), CALLED=(\d+), WAITING=(\d+)/);
      if (!match) return { served: 0, called: 0, waiting: 0 };
      return {
        served: Number(match[1]),
        called: Number(match[2]),
        waiting: Number(match[3]),
      };
    } catch (err) {
      return { served: 0, called: 0, waiting: 0 };
    }
  }, [systemStats]);

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

        {/* Tabs Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8 -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'clinics', label: 'Clinic Management', icon: Building2 },
              { id: 'doctors', label: 'Doctor Management', icon: Stethoscope },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
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
            {systemStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Appointments"
                  value={systemStats.totalAppointments}
                  icon={TrendingUp}
                  color="blue"
                />
                <StatCard
                  title="Completed"
                  value={systemStats.completedAppointments}
                  icon={CheckCircle2}
                  color="green"
                />
                <StatCard
                  title="Total Users"
                  value={systemStats.totalUsers}
                  icon={Users}
                  color="purple"
                />
                <StatCard
                  title="Active Clinics"
                  value={systemStats.activeClinics}
                  icon={Building2}
                  color="indigo"
                />
              </div>
            )}

            {/* System Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>System Statistics</CardTitle>
                <CardDescription>Real-time overview of system performance</CardDescription>
              </CardHeader>
              <CardContent>
                {systemStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-slate-900">
                            Completed Appointments
                          </span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">
                          {systemStats.completedAppointments}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <XCircle className="h-5 w-5 text-rose-600" />
                          <span className="text-sm font-medium text-slate-900">Cancellations</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">
                          {systemStats.cancellations}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-slate-900">Total Users</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">
                          {systemStats.totalUsers}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                          <span className="text-sm font-medium text-slate-900">Active Clinics</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">
                          {systemStats.activeClinics}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-orange-50 text-orange-600">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <span className="text-base font-semibold text-slate-800">
                            Queue Statistics
                          </span>
                        </div>

                        <div className="flex gap-3 text-sm font-semibold text-slate-800">
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">
                            Served: {parsedQueueStats.served || 0}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                            Called: {parsedQueueStats.called || 0}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                            Waiting: {parsedQueueStats.waiting || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-slate-600" />
                          <span className="text-sm font-medium text-slate-900">Generated At</span>
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {formatDateTime(systemStats.reportGeneratedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600">No statistics available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-slate-900">{users.length}</p>
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full justify-start gap-2"
                    onClick={() => setActiveTab('users')}
                  >
                    Manage Users →
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Total Clinics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-slate-900">{clinics.length}</p>
                    <Building2 className="h-8 w-8 text-slate-400" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full justify-start gap-2"
                    onClick={() => setActiveTab('clinics')}
                  >
                    Manage Clinics →
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Total Doctors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-slate-900">{doctors.length}</p>
                    <Stethoscope className="h-8 w-8 text-slate-400" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full justify-start gap-2"
                    onClick={() => setActiveTab('doctors')}
                  >
                    Manage Doctors →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Form */}
            <Card>
              <CardHeader>
                <CardTitle>{editingUserId ? 'Edit User' : 'Create New User'}</CardTitle>
                <CardDescription>
                  {editingUserId
                    ? 'Update user information and permissions'
                    : 'Add a new user to the system with role assignment'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleUserSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="user-email">Email Address *</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={userForm.email}
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-password">
                        Password {editingUserId && '(leave blank to keep current)'}
                      </Label>
                      <Input
                        id="user-password"
                        type="password"
                        value={userForm.password}
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                        required={!editingUserId}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-name">Full Name</Label>
                      <Input
                        id="user-name"
                        type="text"
                        value={userForm.name}
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-phone">Phone Number</Label>
                      <Input
                        id="user-phone"
                        type="tel"
                        value={userForm.phone}
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, phone: event.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-role">User Group *</Label>
                      <Select
                        id="user-role"
                        value={userForm.role}
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, role: event.target.value }))
                        }
                        required
                      >
                        <option value="PATIENT">Patient</option>
                        <option value="CLINIC_STAFF">Clinic Staff</option>
                        <option value="SYSTEM_ADMINISTRATOR">System Administrator</option>
                      </Select>
                    </div>

                    {userForm.role === "CLINIC_STAFF" && (
                      <div className="space-y-2">
                        <Label htmlFor="user-clinic">Assigned Clinic</Label>
                        <Select
                          id="user-clinic"
                          value={userForm.clinicId}
                          onChange={(event) =>
                            setUserForm((prev) => ({ ...prev, clinicId: event.target.value }))
                          }
                        >
                          <option value="">Unassigned</option>
                          {clinics.map((clinic) => (
                            <option key={clinic.id} value={clinic.id}>
                              {clinic.name}
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
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, doctor: event.target.checked }))
                        }
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="user-doctor" className="ml-2 text-sm text-slate-700">
                        Create doctor profile for this user
                      </label>
                    </div>
                  )}

                  {(userForm.role === "CLINIC_STAFF" && userForm.doctor) && (
                    <div className="space-y-2">
                      <Label htmlFor="user-speciality">Medical Speciality</Label>
                      <Input
                        id="user-speciality"
                        type="text"
                        value={userForm.speciality}
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, speciality: event.target.value }))
                        }
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      {editingUserId ? 'Update User' : 'Create User'}
                    </Button>
                    {editingUserId && (
                      <Button type="button" variant="outline" onClick={resetUserForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                      Total: {users.length} users ({filteredUsers.length} displayed)
                    </CardDescription>
                  </div>
                  <div className="w-64">
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setUserPage(1);
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600">
                      {userSearchTerm
                        ? 'No users found matching your search'
                        : 'No users registered yet'}
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
                          {paginatedUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                              <TableCell className="text-sm text-slate-600">{user.email}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {user.roles?.map((role, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className={cn(
                                        'text-xs capitalize border',
                                        getRoleBadgeColor(role)
                                      )}
                                    >
                                      {role.replace(/_/g, ' ').toLowerCase()}
                                    </Badge>
                                  )) || <span className="text-sm text-slate-400">No roles</span>}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {user.staffClinicId || user.doctorClinicId
                                  ? getClinicName(user.staffClinicId || user.doctorClinicId)
                                  : '—'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Select
                                    value={roleSelections[user.id] || ''}
                                    onChange={(event) =>
                                      handleRoleSelectionChange(user.id, event.target.value)
                                    }
                                    className="text-sm w-40"
                                  >
                                    <option value="">Select role...</option>
                                    <option value="PATIENT">Patient</option>
                                    <option value="CLINIC_STAFF">Clinic Staff</option>
                                    {/* <option value="SYSTEM_ADMINISTRATOR">
                                      System Administrator
                                    </option> */}
                                  </Select>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAssignRole(user.id)}
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-rose-600 hover:bg-rose-50"
                                    onClick={() => handleDeleteUser(user.id)}
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
                    <Pagination
                      currentPage={userPage}
                      totalPages={totalUserPages}
                      onPageChange={setUserPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Clinic Management Tab */}
        {activeTab === 'clinics' && (
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
                          {paginatedClinics.map((clinic) => (
                            <TableRow key={clinic.id}>
                              {editingClinicId === clinic.id ? (
                                <TableCell colSpan={5} className="p-6">
                                  <form onSubmit={handleClinicSave} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="clinic-name">Clinic Name *</Label>
                                        <Input
                                          id="clinic-name"
                                          type="text"
                                          value={clinicForm.name}
                                          onChange={(event) =>
                                            handleClinicFieldChange('name', event.target.value)
                                          }
                                          required
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="clinic-address">Address *</Label>
                                        <Input
                                          id="clinic-address"
                                          type="text"
                                          value={clinicForm.address}
                                          onChange={(event) =>
                                            handleClinicFieldChange('address', event.target.value)
                                          }
                                          required
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="clinic-open">Open Time</Label>
                                        <Input
                                          id="clinic-open"
                                          type="time"
                                          value={clinicForm.openTime}
                                          onChange={(event) =>
                                            handleClinicFieldChange('openTime', event.target.value)
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="clinic-close">Close Time</Label>
                                        <Input
                                          id="clinic-close"
                                          type="time"
                                          value={clinicForm.closeTime}
                                          onChange={(event) =>
                                            handleClinicFieldChange('closeTime', event.target.value)
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="clinic-interval">
                                          Slot Interval (minutes)
                                        </Label>
                                        <Input
                                          id="clinic-interval"
                                          type="number"
                                          min="5"
                                          step="5"
                                          value={clinicForm.slotInterval}
                                          onChange={(event) =>
                                            handleClinicFieldChange(
                                              'slotInterval',
                                              event.target.value
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-3">
                                      <Button
                                        type="submit"
                                        disabled={savingClinic}
                                        className="gap-2"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {savingClinic ? 'Saving...' : 'Save Changes'}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClinicCancel}
                                        disabled={savingClinic}
                                      >
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
                                      {clinic.openTime || 'N/A'} - {clinic.closeTime || 'N/A'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-600">
                                    {clinic.defaultSlotIntervalMinutes} mins
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditClinic(clinic)}
                                    >
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
                    <Pagination
                      currentPage={clinicPage}
                      totalPages={totalClinicPages}
                      onPageChange={setClinicPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Doctor Management Tab */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Schedule Management</CardTitle>
                <CardDescription>
                  Configure appointment slot intervals for each doctor (Total: {doctors.length}{' '}
                  doctors)
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
                            <TableHead className="">Update Schedule</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedDoctors.map((doctor) => (
                            <TableRow key={doctor.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Stethoscope className="h-4 w-4 text-blue-600" />
                                  {doctor.fullName || `Doctor #${doctor.id}`}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {doctor.clinicId ? getClinicName(doctor.clinicId) : 'Unassigned'}
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {doctor.slotIntervalMinutes
                                  ? `${doctor.slotIntervalMinutes} minutes`
                                  : 'Not set'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="5"
                                    step="5"
                                    value={doctorEdits[doctor.id] ?? ''}
                                    onChange={(event) =>
                                      handleDoctorIntervalChange(doctor.id, event.target.value)
                                    }
                                    placeholder="Minutes"
                                    className="w-24 text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleDoctorScheduleSave(doctor.id)}
                                    disabled={savingDoctorId === doctor.id}
                                  >
                                    {savingDoctorId === doctor.id ? 'Saving...' : 'Update'}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination
                      currentPage={doctorPage}
                      totalPages={totalDoctorPages}
                      onPageChange={setDoctorPage}
                    />
                  </>
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
function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
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

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
      <div className="text-sm text-slate-700">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          Previous
        </Button>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
