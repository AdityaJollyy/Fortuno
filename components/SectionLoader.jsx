import { BarLoader } from "react-spinners";

export function SectionLoader({ className = "mt-4" }) {
  return <BarLoader className={className} width="100%" color="#9333ea" />;
}
