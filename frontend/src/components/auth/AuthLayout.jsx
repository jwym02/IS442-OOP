import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function AuthLayout({ title, description, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,hsl(221_83%_63%)_0%,hsl(221_83%_53%)_45%,hsl(221_83%_48%)_100%)] px-4 py-12">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" aria-hidden />
      <div className="relative z-10 grid w-full max-w-5xl gap-10 rounded-3xl bg-white/95 p-6 shadow-2xl ring-1 ring-black/5 backdrop-blur">
        <div className="grid gap-4 text-center md:text-left">
          <h1 className="flex items-center gap-4 text-2xl font-semibold tracking-tight text-slate-900">
            <img src="/logo.png" alt="" className="w-16 h-12" />
            SingHealth Clinic System
          </h1>
        </div>
        <div className="grid gap-6 md:grid-cols-[1.1fr_minmax(0,0.9fr)] md:items-start">
          <div className="hidden h-full flex-col justify-between rounded-2xl bg-slate-50 p-8 md:flex">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Your care, streamlined</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage visits, check queue positions in real time, and access your medical history
                  without waiting on the phone.
                </p>
              </div>
              <ul className="space-y-4 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Cooperative scheduling with guided availability.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Secure messaging and doctor notes in one place.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Queue transparency that keeps you informed.
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Support</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">help@singhealth.sg</p>
            </div>
          </div>
          <Card className="mx-auto w-full max-w-md rounded-2xl border-none bg-white/90 shadow-xl ring-1 ring-black/5">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-slate-900">{title}</CardTitle>
              {description ? (
                <CardDescription className="text-base text-muted-foreground">
                  {description}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-6">{children}</CardContent>
            {footer ? (
              <div className="border-t border-dashed border-slate-200 p-6 pt-4 text-center text-sm text-slate-600">
                {footer}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
