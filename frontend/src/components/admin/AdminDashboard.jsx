import { useEffect, useState } from 'react';
import { adminAPI, clinicAPI, doctorAPI, statsAPI } from '../../services/api';
import { useToast } from '../../context/useToast';

export default function AdminDashboard() {
  const { show } = useToast();
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

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    setDoctorEdits((prev) => {
      const next = {};
      doctors.forEach((doctor) => {
        next[doctor.id] = prev[doctor.id] ?? doctor.slotIntervalMinutes ?? '';
      });
      return next;
    });
  }, [doctors]);

  const refreshAll = async () => {
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
  };

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
      show(error?.userMessage || error.response?.data?.message || 'Unable to save user.', 'error');
    }
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      email: user.email || '',
      password: '',
      role: user.roles?.[0] || 'PATIENT',
      name: user.name || '',
      phone: user.phone || '',
      clinicId: user.staffClinicId || user.doctorClinicId || '',
      doctor: Boolean(user.doctorProfileId),
      speciality: '',
    });
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      show('User deleted.', 'success');
      refreshAll();
    } catch (error) {
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to delete user.',
        'error'
      );
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
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to assign role.',
        'error'
      );
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
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to update clinic.',
        'error'
      );
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
      show(
        error?.userMessage || error.response?.data?.message || 'Unable to update doctor schedule.',
        'error'
      );
    } finally {
      setSavingDoctorId(null);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h2>System Administration</h2>
        <button className="btn btn-secondary" onClick={refreshAll}>
          Refresh
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <h3>System Overview</h3>
          {systemStats ? (
            <ul className="stats-list">
              <li>
                <strong>Total Appointments:</strong> {systemStats.totalAppointments}
              </li>
              <li>
                <strong>Completed Appointments:</strong> {systemStats.completedAppointments}
              </li>
              <li>
                <strong>Cancellations:</strong> {systemStats.cancellations}
              </li>
              <li>
                <strong>Total Users:</strong> {systemStats.totalUsers}
              </li>
              <li>
                <strong>Active Clinics:</strong> {systemStats.activeClinics}
              </li>
              <li>
                <strong>Queue Snapshot:</strong> {systemStats.queueStatistics || '-'}
              </li>
              <li>
                <strong>Generated At:</strong> {systemStats.reportGeneratedAt}
              </li>
            </ul>
          ) : (
            <p>No statistics available yet.</p>
          )}
        </div>

        <div className="card">
          <h3>Clinics</h3>
          {clinics.length === 0 ? (
            <p>No clinics configured.</p>
          ) : (
            <div className="list">
              {clinics.map((clinic) => (
                <div key={clinic.id} className="list-item">
                  {editingClinicId === clinic.id ? (
                    <form className="form" onSubmit={handleClinicSave} style={{ width: '100%' }}>
                      <div className="form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          value={clinicForm.name}
                          onChange={(event) => handleClinicFieldChange('name', event.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input
                          type="text"
                          value={clinicForm.address}
                          onChange={(event) =>
                            handleClinicFieldChange('address', event.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Operating Hours</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="time"
                            value={clinicForm.openTime}
                            onChange={(event) =>
                              handleClinicFieldChange('openTime', event.target.value)
                            }
                          />
                          <span style={{ alignSelf: 'center' }}>to</span>
                          <input
                            type="time"
                            value={clinicForm.closeTime}
                            onChange={(event) =>
                              handleClinicFieldChange('closeTime', event.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Slot Interval (minutes)</label>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={clinicForm.slotInterval}
                          onChange={(event) =>
                            handleClinicFieldChange('slotInterval', event.target.value)
                          }
                        />
                      </div>
                      <div className="actions">
                        <button type="submit" className="btn btn-success" disabled={savingClinic}>
                          {savingClinic ? 'Saving...' : 'Save Clinic'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleClinicCancel}
                          disabled={savingClinic}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <strong>{clinic.name}</strong>
                        <div>{clinic.address}</div>
                        <div>
                          Hours: {clinic.openTime || 'N/A'} - {clinic.closeTime || 'N/A'} (every{' '}
                          {clinic.defaultSlotIntervalMinutes} mins)
                        </div>
                      </div>
                      <div className="actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleEditClinic(clinic)}
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Doctors</h3>
          {doctors.length === 0 ? (
            <p>No doctors registered.</p>
          ) : (
            <div className="list">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="list-item">
                  <div>
                    <strong>{doctor.fullName || `Doctor #${doctor.id}`}</strong>
                    <div>Clinic #{doctor.clinicId ?? 'Unassigned'}</div>
                    <div>Current Slot Interval: {doctor.slotIntervalMinutes || '-'} minutes</div>
                  </div>
                  <div className="actions" style={{ gap: 8 }}>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={doctorEdits[doctor.id] ?? ''}
                      onChange={(event) =>
                        handleDoctorIntervalChange(doctor.id, event.target.value)
                      }
                      style={{ width: 100 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDoctorScheduleSave(doctor.id)}
                      disabled={savingDoctorId === doctor.id}
                    >
                      {savingDoctorId === doctor.id ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>User Management</h3>
          <form className="form" onSubmit={handleUserSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={userForm.password}
                placeholder={editingUserId ? 'Leave blank to keep current password' : ''}
                onChange={(event) =>
                  setUserForm((prev) => ({ ...prev, password: event.target.value }))
                }
                required={!editingUserId}
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={userForm.role}
                onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
                required
              >
                <option value="PATIENT">Patient</option>
                <option value="CLINIC_STAFF">Clinic Staff</option>
                <option value="SYSTEM_ADMINISTRATOR">System Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={userForm.name}
                onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={userForm.phone}
                onChange={(event) =>
                  setUserForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label>Clinic (for staff/doctor)</label>
              <select
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
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={userForm.doctor}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, doctor: event.target.checked }))
                  }
                />{' '}
                Also create a doctor profile
              </label>
            </div>

            {userForm.doctor && (
              <div className="form-group">
                <label>Doctor Speciality</label>
                <input
                  type="text"
                  value={userForm.speciality}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, speciality: event.target.value }))
                  }
                />
              </div>
            )}

            <div className="actions">
              <button type="submit" className="btn btn-success">
                {editingUserId ? 'Update User' : 'Create User'}
              </button>
              {editingUserId && (
                <button type="button" className="btn btn-secondary" onClick={resetUserForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="list" style={{ marginTop: 24 }}>
            {users.length === 0 ? (
              <p>No users registered yet.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="list-item">
                  <div>
                    <strong>{user.name || user.email}</strong>
                    <div>{user.email}</div>
                    <div>Roles: {user.roles?.join(', ') || 'N/A'}</div>
                  </div>
                  <div className="actions">
                    <select
                      value={roleSelections[user.id] || ''}
                      onChange={(event) => handleRoleSelectionChange(user.id, event.target.value)}
                    >
                      <option value="">Assign Role...</option>
                      <option value="PATIENT">Patient</option>
                      <option value="CLINIC_STAFF">Clinic Staff</option>
                      <option value="SYSTEM_ADMINISTRATOR">System Administrator</option>
                    </select>
                    <button className="btn btn-secondary" onClick={() => handleAssignRole(user.id)}>
                      Assign
                    </button>
                    <button className="btn btn-warning" onClick={() => handleEditUser(user)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDeleteUser(user.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
