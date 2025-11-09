import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import PatientDashboard from '../components/patient/PatientDashboard';
import StaffDashboard from '../components/staff/StaffDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';
import { AppShell } from '../components/layout/AppShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';

export default function Dashboard() {
  const { user, logout, hasRole, activeRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isPatient = Boolean(user.patientProfileId);
  const isStaff = Boolean(user.staffProfileId);
  const isDoctor = Boolean(user.doctorProfileId);
  const isAdmin = hasRole('SYSTEM_ADMINISTRATOR');
  const clinicId = user.staffClinicId || user.doctorClinicId || null;

  const views = [];
  if (isPatient && (!activeRole || activeRole === 'PATIENT')) {
    views.push({
      key: 'patient',
      label: 'Patient Home',
      component: <PatientDashboard patientId={user.patientProfileId} userName={user.name} />,
    });
  }
  if (
    (isStaff || isDoctor) &&
    clinicId &&
    (!activeRole || activeRole === 'STAFF' || activeRole === 'DOCTOR')
  ) {
    views.push({
      key: 'clinic',
      label: isDoctor && !isStaff ? 'Doctor Workspace' : 'Clinic Operations',
      component: (
        <StaffDashboard
          clinicId={clinicId}
          staffProfileId={user.staffProfileId}
          doctorProfileId={user.doctorProfileId}
        />
      ),
    });
  }
  if (isAdmin && (!activeRole || activeRole === 'SYSTEM_ADMINISTRATOR')) {
    views.push({
      key: 'admin',
      label: 'System Admin',
      component: <AdminDashboard />,
    });
  }

  const defaultView = views[0]?.key;

  return (
    <AppShell user={user} onLogout={logout}>
      {views.length ? (
        <Tabs defaultValue={defaultView} className="space-y-6">
          {/* <TabsList>
            {views.map((view) => (
              <TabsTrigger key={view.key} value={view.key}>
                {view.label}
              </TabsTrigger>
            ))}
          </TabsList> */}
          {views.map((view) => (
            <TabsContent key={view.key} value={view.key}>
              {view.component}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            We couldn&apos;t find any roles assigned to your account. Please contact an
            administrator for assistance.
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
