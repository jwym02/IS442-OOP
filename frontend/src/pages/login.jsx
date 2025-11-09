import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, LogIn, Mail, User } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const navigate = useNavigate();
  const { login, devBypassLogin, setActiveRole } = useAuth();

  const devBypassEnabled = import.meta.env.VITE_ENABLE_FAKE_LOGIN === 'true' || import.meta.env.DEV;

  const getRoleDisplayName = (role) => {
    const roleMap = {
      PATIENT: 'Patient',
      CLINIC_STAFF: 'Clinic Staff',
      DOCTOR: 'Doctor',
      SYSTEM_ADMINISTRATOR: 'Administrator',
    };
    return roleMap[role] || role;
  };

  const handleRoleSelection = (selectedRole) => {
    setActiveRole(selectedRole);
    setShowRoleDialog(false);
    navigate('/dashboard');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;

    setError('');
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);

    if (result.success) {
      // Check if user has multiple roles
      const roles = result.user?.roles || [];
      if (roles.length > 1) {
        setUserRoles(roles);
        setShowRoleDialog(true);
      } else if (roles.length === 1) {
        setActiveRole(roles[0]);
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
      return;
    }
    setError(result.error || 'Login failed. Please try again.');
  };

  const handleDevBypass = async (role) => {
    setError('');
    const res = await devBypassLogin(role);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(
        res.error ||
          'Dev bypass is disabled. Ensure VITE_ENABLE_FAKE_LOGIN=true and restart the frontend dev server.'
      );
    }
  };

  return (
    <>
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Select Your Role</DialogTitle>
            <DialogDescription>
              You have multiple roles. Please select which role you want to continue as
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {userRoles.map((role) => (
              <Button
                key={role}
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleRoleSelection(role)}
              >
                <User className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">{getRoleDisplayName(role)}</div>
                  <div className="text-xs text-muted-foreground">
                    Continue as {getRoleDisplayName(role).toLowerCase()}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AuthLayout
        title="Welcome back"
        description="Log in to manage appointments, browse medical records, and stay updated on clinic queues."
        footer={
          <span>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Register as a patient
            </Link>
          </span>
        }
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {error ? (
            <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Login unsuccessful</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            <LogIn className="mr-2 h-4 w-4" />
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>

          {devBypassEnabled ? (
            <div className="mt-6 border-t border-dashed pt-6">
              <p className="mb-3 text-center text-xs uppercase tracking-wide text-muted-foreground">
                Developer quick login
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleDevBypass('PATIENT')}
                  disabled={busy}
                >
                  Patient
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleDevBypass('STAFF')}
                  disabled={busy}
                >
                  Staff
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleDevBypass('DOCTOR')}
                  disabled={busy}
                >
                  Doctor
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleDevBypass('ADMIN')}
                  disabled={busy}
                >
                  Admin
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </AuthLayout>
    </>
  );
}
