import { Suspense, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Bot,
  Compass,
  House,
  Presentation,
  Flag,
  HeartHandshake,
  Loader2,
  LogOut,
  Menu,
  Quote,
  Settings,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmt, useT } from "@/i18n";
import { backend } from "@/lib/backend";
import { paths } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { AlertsProvider, useAlerts } from "@/providers/alerts";
import { useAuth } from "@/providers/auth";
import { Logo } from "./logo";
import { QuickSearch } from "./quick-search";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

/**
 * Each part of FinHer is its own door: the personal path first, then what you can
 * explore, then the community. Settings live in the account menu.
 */
function useNavGroups(): { label?: string; items: NavItem[] }[] {
  const N = useT().app.nav;
  return [
    {
      items: [
        { to: paths.home, label: N.overview, icon: Compass },
        { to: paths.assistant, label: N.assistant, icon: Bot },
      ],
    },
    {
      label: N.explore,
      items: [
        { to: paths.learn, label: N.education, icon: BookOpen },
        { to: paths.challenges, label: N.challenges, icon: Flag },
        { to: paths.softSkills, label: N.softSkills, icon: Presentation },
        { to: paths.family, label: N.family, icon: HeartHandshake },
        { to: paths.stories, label: N.stories, icon: Quote },
      ],
    },
    { label: N.connect, items: [{ to: paths.community, label: N.community, icon: Users }] },
  ];
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const groups = useNavGroups();
  return (
    <div className="flex flex-col gap-5">
      <HomeLink onNavigate={onNavigate} />
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && <p className="label-mono px-3 pb-2 text-muted-foreground">{g.label}</p>}
          <ul className="flex flex-col gap-0.5">
            {g.items.map(({ to, label, icon: Icon, soon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === paths.home}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-full px-3 py-2.5 text-[0.95rem] font-medium transition-colors",
                      isActive ? "bg-primary/8 font-semibold text-primary" : "text-foreground hover:bg-accent",
                    )
                  }
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {soon && <span className="label-mono text-[0.62rem] text-primary">{t.app.nav.soon}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Back to the public home page (where "Quem somos" lives), always one click away after login. */
function HomeLink({ onNavigate, compact }: { onNavigate?: () => void; compact?: boolean }) {
  const N = useT().app.nav;
  return (
    <Link
      to="/"
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-full text-[0.95rem] font-medium transition-colors hover:bg-accent",
        compact ? "border px-3 py-2 text-sm" : "border border-dashed px-3 py-2.5 text-muted-foreground hover:text-foreground",
      )}
    >
      <House className="size-4.5 shrink-0" aria-hidden="true" />
      <span className={cn(compact && "sr-only sm:not-sr-only")}>{N.home}</span>
    </Link>
  );
}

function useInitial() {
  const { user, profile } = useAuth();
  return (profile?.displayName || user?.email || "?").charAt(0).toUpperCase();
}

function Avatar({ className }: { className?: string }) {
  const initial = useInitial();
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground", className)} aria-hidden="true">
      {initial}
    </span>
  );
}

function UserMenu() {
  const t = useT();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.app.userMenu}>
          <Avatar />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block text-sm text-foreground">{profile?.displayName}</span>
          <span className="block font-normal">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/")}>
          <House /> {t.app.nav.home}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate(paths.settings)}>
          <UserRound /> {t.app.nav.settings}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await backend.signOut();
            navigate("/");
          }}
        >
          <LogOut /> {t.auth.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Phones get the four most used doors at thumb reach; "Mais" opens the rest. */
function TabBar({ moreOpen, onMore }: { moreOpen: boolean; onMore: () => void }) {
  const N = useT().app.nav;
  const tabs: NavItem[] = [
    { to: paths.home, label: N.overview, icon: Compass },
    { to: paths.learn, label: N.education, icon: BookOpen },
    { to: paths.challenges, label: N.challenges, icon: Flag },
    { to: paths.assistant, label: N.assistantShort, icon: Bot },
  ];
  const tab = "flex flex-1 flex-col items-center gap-1 pb-1 pt-2 text-[0.7rem] font-medium";
  return (
    <nav
      aria-label={N.tabsLabel}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
    >
      <ul className="flex">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex flex-1">
            <NavLink
              to={to}
              end={to === paths.home}
              className={({ isActive }) => cn(tab, isActive && !moreOpen ? "font-semibold text-primary" : "text-muted-foreground")}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
        <li className="flex flex-1">
          <button
            type="button"
            onClick={onMore}
            aria-expanded={moreOpen}
            aria-controls="app-more-nav"
            className={cn(tab, moreOpen ? "font-semibold text-primary" : "text-muted-foreground")}
          >
            {moreOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            {N.more}
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** Opportunity alerts: a bell with the number of new opportunities that fit her profile. */
function AlertsBell() {
  const O = useT().opportunities;
  const { alerts, pending } = useAlerts();
  if (!alerts.enabled) return null;
  const count = pending.length;
  return (
    <Button asChild variant="ghost" size="icon">
      <Link to={paths.opportunities} aria-label={count ? fmt(O.bellCount, { count }) : O.bell} className="relative">
        <Bell />
        {count > 0 && (
          <span className="absolute right-1 top-1 grid min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] font-bold leading-4.5 text-primary-foreground" aria-hidden="true">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}

export function AppShell() {
  return (
    <AlertsProvider>
      <Shell />
    </AlertsProvider>
  );
}

function Shell() {
  const t = useT();
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the phone menu whenever the page changes.
  useEffect(() => setMoreOpen(false), [pathname]);

  // Lift the fixed disclaimer above the phone tab bar while the app is on screen.
  useEffect(() => {
    document.documentElement.classList.add("has-tabbar");
    return () => document.documentElement.classList.remove("has-tabbar");
  }, []);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-[env(safe-area-inset-top,0px)] hidden h-dvh flex-col border-r px-4 pb-20 pt-6 lg:flex">
        <Logo to={paths.home} className="px-3" />
        <nav aria-label={t.nav.mainLabel} className="mt-8 flex-1 overflow-y-auto">
          <SideNav />
        </nav>
        <Link to={paths.settings} className="flex items-center gap-3 border-t px-3 pt-4 hover:text-primary">
          <Avatar />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{profile?.displayName}</span>
            <span className="text-xs text-muted-foreground">{t.app.nav.account}</span>
          </span>
          <Settings className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
        </Link>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 flex h-16 items-center gap-2 sm:gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6 lg:border-b-0 lg:px-10">
          <Logo to={paths.home} className="lg:hidden" />
          <QuickSearch className="ml-auto lg:ml-0 lg:w-full lg:max-w-md" />
          <span className="lg:hidden">
            <HomeLink compact />
          </span>
          <div className="flex items-center gap-1 lg:ml-auto">
            <AlertsBell />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        {moreOpen && (
          <nav
            id="app-more-nav"
            aria-label={t.nav.mainLabel}
            className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-50 max-h-[70dvh] overflow-y-auto border-t bg-card p-4 shadow-2xl lg:hidden"
          >
            <SideNav onNavigate={() => setMoreOpen(false)} />
          </nav>
        )}
        <main id="main" className="flex-1 px-4 pb-36 pt-6 sm:px-6 lg:px-10 lg:pb-24 lg:pt-6">
          {/* Pages load on demand; keep the shell on screen while one arrives. */}
          <Suspense
            fallback={
              <div className="grid place-items-center py-24" role="status">
                <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
                <span className="sr-only">{t.common.loading}</span>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <TabBar moreOpen={moreOpen} onMore={() => setMoreOpen((o) => !o)} />
    </div>
  );
}
