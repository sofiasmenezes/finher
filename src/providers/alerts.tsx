import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { OPPORTUNITIES, type Opportunity } from "@/content/loader";
import { backend } from "@/lib/backend";
import { DEFAULT_ALERTS, isOnboarded, type OpportunityAlerts } from "@/lib/domain";
import { pendingAlerts, today } from "@/lib/opportunities";
import { useAuth } from "@/providers/auth";

interface AlertsValue {
  alerts: OpportunityAlerts;
  /** Upcoming opportunities that fit her profile and she hasn't seen yet. */
  pending: Opportunity[];
  setEnabled: (enabled: boolean) => Promise<void>;
  markSeen: (ids: string[]) => void;
}

const AlertsContext = createContext<AlertsValue | null>(null);

/** Opportunity-calendar alerts for the signed-in member, shared by the header bell and the calendar. */
export function AlertsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [alerts, setAlerts] = useState<OpportunityAlerts>(DEFAULT_ALERTS);

  useEffect(() => {
    if (!user) return;
    backend.getOpportunityAlerts(user.id).then(setAlerts).catch(() => {});
  }, [user]);

  const save = useCallback(
    (next: OpportunityAlerts) => {
      setAlerts(next);
      if (user) return backend.setOpportunityAlerts(user.id, next).catch(() => {});
      return Promise.resolve();
    },
    [user],
  );

  const pending = useMemo(
    () => pendingAlerts(OPPORTUNITIES, isOnboarded(profile) ? profile : null, alerts, today()),
    [alerts, profile],
  );

  const value = useMemo<AlertsValue>(
    () => ({
      alerts,
      pending,
      setEnabled: async (enabled) => {
        await save({ ...alerts, enabled });
      },
      markSeen: (ids) => {
        const fresh = ids.filter((id) => !alerts.seen.includes(id));
        if (fresh.length) save({ ...alerts, seen: [...alerts.seen, ...fresh] });
      },
    }),
    [alerts, pending, save],
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const v = useContext(AlertsContext);
  if (!v) throw new Error("useAlerts must be used inside AlertsProvider");
  return v;
}
