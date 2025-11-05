import {
    Building2,
    CheckCircle2,
    Users,
    XCircle,
    AlertCircle,
    Clock,
    Stethoscope,
    TrendingUp,
    BarChart3
  } from "lucide-react";
  import { Button } from "../ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
  import StatCard from "./shared/StatCard";
  
  function formatDateTime(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  
  function parseQueueStats(queueStatistics) {
    try {
      if (!queueStatistics) return { served: 0, called: 0, waiting: 0 };
      const m = queueStatistics.match(/SERVED=(\d+), CALLED=(\d+), WAITING=(\d+)/);
      if (!m) return { served: 0, called: 0, waiting: 0 };
      return { served: Number(m[1]), called: Number(m[2]), waiting: Number(m[3]) };
    } catch {
      return { served: 0, called: 0, waiting: 0 };
    }
  }
  
  export default function OverviewSection({
    usersCount,
    clinicsCount,
    doctorsCount,
    systemStats,
    onGoUsers,
    onGoClinics,
    onGoDoctors,
  }) {
    const qs = parseQueueStats(systemStats?.queueStatistics);
  
    return (
      <div className="space-y-6">
        {/* KPI cards */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Appointments" value={systemStats.totalAppointments} icon={TrendingUp} color="blue" />
            <StatCard title="Completed" value={systemStats.completedAppointments} icon={CheckCircle2} color="green" />
            <StatCard title="Total Users" value={systemStats.totalUsers} icon={Users} color="purple" />
            <StatCard title="Active Clinics" value={systemStats.activeClinics} icon={Building2} color="indigo" />
          </div>
        )}
  
        {/* System Stats */}
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
                      <span className="text-sm font-medium text-slate-900">Completed Appointments</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{systemStats.completedAppointments}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-rose-600" />
                      <span className="text-sm font-medium text-slate-900">Cancellations</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{systemStats.cancellations}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-slate-900">Total Users</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{systemStats.totalUsers}</span>
                  </div>
                </div>
  
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                      <span className="text-sm font-medium text-slate-900">Active Clinics</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{systemStats.activeClinics}</span>
                  </div>
  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-orange-50 text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <span className="text-base font-semibold text-slate-800">Queue Statistics</span>
                    </div>
  
                    <div className="flex gap-3 text-sm font-semibold text-slate-800">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">Served: {qs.served}</span>
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">Called: {qs.called}</span>
                      <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">Waiting: {qs.waiting}</span>
                    </div>
                  </div>
  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-slate-600" />
                      <span className="text-sm font-medium text-slate-900">Generated At</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{formatDateTime(systemStats.reportGeneratedAt)}</span>
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
  
        {/* Quick cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-900">{usersCount}</p>
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <Button variant="ghost" size="sm" className="mt-3 w-full justify-start gap-2" onClick={onGoUsers}>
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
                <p className="text-3xl font-bold text-slate-900">{clinicsCount}</p>
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
              <Button variant="ghost" size="sm" className="mt-3 w-full justify-start gap-2" onClick={onGoClinics}>
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
                <p className="text-3xl font-bold text-slate-900">{doctorsCount}</p>
                <Stethoscope className="h-8 w-8 text-slate-400" />
              </div>
              <Button variant="ghost" size="sm" className="mt-3 w-full justify-start gap-2" onClick={onGoDoctors}>
                Manage Doctors →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  