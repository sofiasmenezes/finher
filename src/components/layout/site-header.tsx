import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { useAuth } from "@/providers/auth";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const t = useT();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#how", label: t.nav.howItWorks },
    { href: "#universities", label: t.nav.forUniversities },
    { href: "#faq", label: t.nav.faq },
  ];

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-transparent bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label={t.nav.mainLabel} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/app">{t.app.nav.overview}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">{t.nav.login}</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/signup">{t.nav.signup}</Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label={t.nav.mainLabel} className="border-t bg-background px-4 pb-5 pt-2 md:hidden">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 font-medium">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {user ? (
              <Button asChild className="col-span-2">
                <Link to="/app">{t.app.nav.overview}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/login">{t.nav.login}</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">{t.nav.signup}</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
