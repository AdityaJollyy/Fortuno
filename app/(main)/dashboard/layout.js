export default function DashboardLayout({ children }) {
  return (
    <div className="space-y-6 md:space-y-7">
      <h1 className="text-h2 font-heading text-foreground font-extrabold tracking-tight">
        Dashboard
      </h1>
      {children}
    </div>
  );
}
