import { useEffect, useState } from "react";
import { backend } from "@/lib/backend";
import { useAuth } from "@/providers/auth";

/** Checklist progress for the signed-in user, with optimistic toggling. */
export function useChecklist() {
  const { user } = useAuth();
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (user) backend.getChecklist(user.id).then((ids) => setDone(new Set(ids))).catch(() => {});
  }, [user]);
  const toggle = (id: string, value: boolean) => {
    if (!user) return;
    setDone((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
    backend.setChecklistItem(user.id, id, value).catch(() =>
      // Roll back if the save failed.
      setDone((prev) => {
        const next = new Set(prev);
        if (value) next.delete(id);
        else next.add(id);
        return next;
      }),
    );
  };
  return { done, toggle };
}
