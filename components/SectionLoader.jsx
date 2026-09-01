import { BarLoader } from "react-spinners";

export function SectionLoader({ className = "mt-4" }) {
  return (
    <BarLoader
      className={className}
      width="100%"
      color="var(--primary)"
      // react-spinners derives the track from `color` by parsing it as a hex,
      // which a var() cannot be. Set the track from the token instead.
      cssOverride={{ backgroundColor: "var(--muted)" }}
    />
  );
}
