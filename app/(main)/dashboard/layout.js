export default function DashboardLayout({ children }) {
  return (
    <div className="px-5">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="gradient gradient-title text-6xl font-bold tracking-tight">
          Dashboard
        </h1>
      </div>
      {children}
    </div>
  );
}
