import { Link } from "react-router-dom";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M8 22 L14 15 L18 19 L24 10"
        fill="none"
        stroke="var(--cta)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ to = "/", className }: { to?: string; className?: string }) {
  const t = useT();
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2.5 rounded-lg", className)}>
      <LogoMark />
      {/* Wordmark: "Fin" in ink, "Her" in plum, set in the display serif. */}
      <span className="font-display text-[1.45rem] font-semibold leading-none tracking-tight">
        {t.brand.name.slice(0, 3)}
        <span className="text-primary">{t.brand.name.slice(3)}</span>
      </span>
    </Link>
  );
}
