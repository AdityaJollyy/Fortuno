const FOOTER_LINKS = ["Privacy", "Terms", "Support"];

export function Footer() {
  return (
    <footer className="border-border border-t">
      <div className="text-ink-faint max-w-page mx-auto flex flex-col items-center gap-3 px-5 py-8 text-center md:flex-row md:justify-between md:px-8 md:text-left">
        <p className="text-label font-heading font-bold tracking-[.13em] uppercase">
          © {new Date().getFullYear()} Fortuno · Made in India · ₹ only
        </p>

        <ul className="text-label font-heading flex items-center gap-5 font-bold tracking-[.13em] uppercase">
          {FOOTER_LINKS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
