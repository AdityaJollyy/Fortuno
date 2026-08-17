import { SectionLoader } from "@/components/SectionLoader";
import { Suspense } from "react";

export default function DashboardLayout({ children }) {
  return (
    <div className="px-5">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="gradient-title text-6xl font-bold tracking-tight">
          Dashboard
        </h1>
      </div>
      <Suspense fallback={<SectionLoader />}>{children}</Suspense>
    </div>
  );
}
