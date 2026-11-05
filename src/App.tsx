import { Suspense, lazy, useEffect, type ComponentType, type ReactNode } from "react";
import { BrowserRouter, Link, MemoryRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBanner, DisclaimerBar } from "@/components/layout/disclaimer-bar";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { isOnboarded } from "@/lib/domain";
import { paths } from "@/lib/routes";
import Landing from "@/pages/landing";

// Every page but the landing page loads on demand, so the first visit only downloads what it shows.
const named = <K extends string>(load: () => Promise<Record<K, ComponentType<any>>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));
const LoginPage = named(() => import("@/pages/auth"), "LoginPage");
const SignupPage = named(() => import("@/pages/auth"), "SignupPage");
const Onboarding = lazy(() => import("@/pages/onboarding"));
const OverviewPage = lazy(() => import("@/pages/overview"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const CommunityPage = lazy(() => import("@/pages/community"));
const EducationPage = named(() => import("@/pages/education"), "EducationPage");
const AreaGuidePage = named(() => import("@/pages/education"), "AreaGuidePage");
const TopicPage = named(() => import("@/pages/education"), "TopicPage");
const FamilyPage = named(() => import("@/pages/family"), "FamilyPage");
const FamilyPhasePage = named(() => import("@/pages/family"), "FamilyPhasePage");
const StoriesPage = named(() => import("@/pages/stories"), "StoriesPage");
const StoryPage = named(() => import("@/pages/stories"), "StoryPage");
const NavigatorPage = named(() => import("@/pages/navigator"), "NavigatorPage");
const PlaybookPage = named(() => import("@/pages/navigator"), "PlaybookPage");
const SupportPage = named(() => import("@/pages/support"), "SupportPage");
const SoftSkillsPage = named(() => import("@/pages/soft-skills"), "SoftSkillsPage");
const SoftSkillPage = named(() => import("@/pages/soft-skills"), "SoftSkillPage");
const AssistantPage = lazy(() => import("@/pages/assistant"));
import { AuthProvider, useAuth } from "@/providers/auth";
import { ThemeProvider } from "@/providers/theme";

function FullPageLoader() {
  const t = useT();
  return (
    <div className="grid min-h-dvh place-items-center" role="status">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">{t.common.loading}</span>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

/** Everything inside the app needs a completed (current-format) onboarding. */
function RequireOnboarding({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  if (!isOnboarded(profile)) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OverviewRoute() {
  const { profile } = useAuth();
  return isOnboarded(profile) ? <OverviewPage profile={profile} /> : null;
}

function NotFound() {
  const t = useT();
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-sm text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold">{t.notFound.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.notFound.body}</p>
        <Button asChild className="mt-6">
          <Link to="/">{t.notFound.home}</Link>
        </Button>
      </div>
    </main>
  );
}

/** Old addresses (before the navigation was reorganised) keep working. */
function LegacyRedirect({ to }: { to: (p: Record<string, string | undefined>) => string }) {
  return <Navigate to={to(useParams())} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Chrome() {
  const t = useT();
  const { mode } = useAuth();
  return (
    <>
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t.common.skipToContent}
      </a>
      {mode === "demo" && <DemoBanner />}
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<GuestOnly><SignupPage /></GuestOnly>} />
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/app" element={<RequireAuth><RequireOnboarding><AppShell /></RequireOnboarding></RequireAuth>}>
            <Route index element={<OverviewRoute />} />
            <Route path="learn" element={<EducationPage />} />
            <Route path="learn/areas/:areaId" element={<AreaGuidePage />} />
            <Route path="learn/topics/:topicId" element={<TopicPage />} />
            <Route path="challenges" element={<NavigatorPage />} />
            <Route path="challenges/support" element={<SupportPage />} />
            <Route path="challenges/:playbookId/:savedId?" element={<PlaybookPage />} />
            <Route path="soft-skills" element={<SoftSkillsPage />} />
            <Route path="soft-skills/:skillId" element={<SoftSkillPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="family" element={<FamilyPage />} />
            <Route path="family/:phaseId" element={<FamilyPhasePage />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="stories/:storyId" element={<StoryPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="education" element={<Navigate to={paths.learn} replace />} />
            <Route path="education/areas/:id" element={<LegacyRedirect to={(p) => paths.area(p.id!)} />} />
            <Route path="education/topics/:id" element={<LegacyRedirect to={(p) => paths.topic(p.id!)} />} />
            <Route path="journeys" element={<Navigate to={paths.stories} replace />} />
            <Route path="journeys/stories/:id" element={<LegacyRedirect to={(p) => paths.story(p.id!)} />} />
            <Route path="journeys/challenges" element={<Navigate to={paths.challenges} replace />} />
            <Route path="journeys/challenges/:id/:savedId?" element={<LegacyRedirect to={(p) => paths.playbook(p.id!, p.savedId)} />} />
            <Route path="journeys/family" element={<Navigate to={paths.family} replace />} />
            <Route path="journeys/family/:id" element={<LegacyRedirect to={(p) => paths.phase(p.id!)} />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <DisclaimerBar />
    </>
  );
}

// Hosted single-file builds (VITE_ROUTER=memory) can't rewrite URLs, so keep routes in memory there.
const Router = import.meta.env.VITE_ROUTER === "memory" ? MemoryRouter : BrowserRouter;

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Chrome />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
