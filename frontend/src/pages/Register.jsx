import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Lock, Mail, Phone, UserPlus } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);

    const payload = { email, password, name, phone, birthDate };
    const result = await register(payload);
    setBusy(false);

    if (result.success) {
      navigate("/dashboard");
      return;
    }
    setError(result.error || "Registration failed. Please review the details and try again.");
  };

  return (
    <AuthLayout
      title="Create your patient account"
      description="Tell us a little about yourself so we can confirm your identity and personalise your care."
      footer={
        <span>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to login
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Tan Mei Ling"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">Birth date</Label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                placeholder="+65 6123 4567"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Use at least 6 characters. We recommend combining letters, numbers, and symbols.
          </p>
        </div>

        {error ? (
          <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
            <AlertTitle>Registration unsuccessful</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          <UserPlus className="mr-2 h-4 w-4" />
          {busy ? "Creating your account..." : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
