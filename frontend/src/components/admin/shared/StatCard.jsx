// eslint-disable-next-line no-unused-vars
export default function StatCard({ title, value, icon: Icon, color }) {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      green: "bg-green-50 text-green-600 border-green-200",
      purple: "bg-purple-50 text-purple-600 border-purple-200",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
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
  