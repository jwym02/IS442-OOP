import { Stethoscope, LogOut } from 'lucide-react';
import { useAuth } from '../../context/useAuth'; 
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const roleLabels = {
  PATIENT: 'Patient',
  CLINIC_STAFF: 'Clinic Staff',
  DOCTOR: 'Doctor',
  SYSTEM_ADMINISTRATOR: 'System Admin',
};

export function AppShell({ user, onLogout, children }) {
  const activeRole = localStorage.getItem("activeRole")
  const displayName = user?.name || user?.email || 'Signed in user';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-[1920px] flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Stethoscope className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                SingHealth Clinic System
              </h1>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{displayName}</span>
              {user?.clinicName ? (
                <span className="ml-2 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                  {user.clinicName}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeRole && roleLabels[activeRole] && (
                  <Badge variant="secondary">
                    {roleLabels[activeRole]}
                  </Badge>
                )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1920px] w-full px-6 pb-8">{children}</main>
    </div>
  );
}
