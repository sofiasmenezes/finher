import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Download, Eye, Loader2, Pencil, Trash2 } from "lucide-react";
import { CountrySelect } from "@/components/content/blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { useT } from "@/i18n";
import { backend, exportData } from "@/lib/backend";
import { useAuth } from "@/providers/auth";

const CAN_DOWNLOAD = import.meta.env.VITE_NO_DOWNLOADS !== "true";

function ExportCard() {
  const t = useT();
  const S = t.settings;
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [json, setJson] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function build() {
    if (!user) return null;
    const text = JSON.stringify(await exportData(backend, user), null, 2);
    setJson(text);
    return text;
  }

  async function download() {
    setBusy(true);
    setMessage(null);
    try {
      const text = await build();
      if (!text) return;
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `finher-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMessage(t.auth.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    setMessage(null);
    try {
      const text = json ?? (await build());
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setMessage(S.copied);
    } catch {
      setMessage(S.copyFailed);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{S.exportTitle}</CardTitle>
        <CardDescription>{S.exportBody}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          {CAN_DOWNLOAD ? (
            <Button variant="outline" onClick={download} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download />}
              {S.exportButton}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => build().catch(() => setMessage(t.auth.errors.generic))}>
              <Eye /> {S.showButton}
            </Button>
          )}
          <Button variant="ghost" onClick={copy}>
            <Copy /> {S.copyButton}
          </Button>
        </div>
        <p role="status" className="text-sm font-medium">
          {message}
        </p>
        {json && (
          <Textarea
            id="export-json"
            readOnly
            value={json}
            aria-label={S.exportTitle}
            className="h-48 font-mono text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ClearNavigatorCard() {
  const t = useT();
  const S = t.settings;
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function clear() {
    if (!user) return;
    try {
      await backend.deleteAllSituations(user.id);
      setMessage(S.cleared);
    } catch {
      setMessage(t.auth.errors.generic);
    }
    setConfirming(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{S.clearNavigatorTitle}</CardTitle>
        <CardDescription>{S.clearNavigatorBody}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {confirming ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={clear}>
              {S.clearNavigatorConfirm}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t.common.cancel}
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="self-start" onClick={() => setConfirming(true)}>
            <Trash2 /> {S.clearNavigatorButton}
          </Button>
        )}
        <p role="status" className="text-sm font-medium">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const t = useT();
  const S = t.settings;
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setBusy(true);
    setError(null);
    try {
      await backend.deleteAccount();
      navigate("/", { replace: true });
    } catch {
      setError(t.auth.errors.generic);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-semibold">{S.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{S.privacyTitle}</CardTitle>
          <CardDescription>{S.privacyBody}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Button asChild variant="outline" className="self-start">
            <Link to="/onboarding">
              <Pencil /> {S.editAnswers}
            </Link>
          </Button>
          <CountrySelect id="settings-country" />
        </CardContent>
      </Card>

      <ExportCard />
      <ClearNavigatorCard />

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle as="h2">{S.deleteTitle}</CardTitle>
          <CardDescription>{S.deleteBody}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field id="delete-confirm" label={S.deleteConfirmLabel} error={error ?? undefined}>
            {(a) => <Input {...a} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className="max-w-xs" />}
          </Field>
          <Button variant="destructive" className="self-start" disabled={confirm.trim().toUpperCase() !== S.deleteWord || busy} onClick={onDelete}>
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 />}
            {S.deleteButton}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
