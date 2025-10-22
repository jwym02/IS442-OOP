import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import PatientDashboard from '../components/patient/PatientDashboard';
import StaffDashboard from '../components/staff/StaffDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout, hasRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isPatient = Boolean(user.patientProfileId);
  const isStaff = Boolean(user.staffProfileId);
  const isDoctor = Boolean(user.doctorProfileId);
  const isAdmin = hasRole('SYSTEM_ADMINISTRATOR');
  const clinicId = user.staffClinicId || user.doctorClinicId || null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>SingHealth Clinic System</h1>
        <div className="user-info">
          <span>{user.name || user.email}</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {isPatient && (
          <PatientDashboard
            patientId={user.patientProfileId}
            userName={user.name}
          />
        )}
        {(isStaff || isDoctor) && clinicId && (
          <StaffDashboard
            clinicId={clinicId}
            staffProfileId={user.staffProfileId}
            doctorProfileId={user.doctorProfileId}
          />
        )}
        {isAdmin && <AdminDashboard />}
      </main>
    </div>
  );
}
