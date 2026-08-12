import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@kuvend/ui";
import { CheckCircle2, ClipboardCheck, RefreshCw, ShieldCheck } from "lucide-react";

type ModerationCase = {
  proposalId: string;
  kind: string;
  status: string;
  reason: string;
  reviewers: string[];
};
type Decision = "voting_open" | "needs_changes" | "rejected" | "duplicate";

export function AdminApp() {
  const [token, setToken] = useState("");
  const [actor, setActor] = useState("moderatori-lokal");
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [message, setMessage] = useState("Lidhu për të ngarkuar radhën e moderimit.");
  const headers = () => ({
    authorization: `Bearer ${token}`,
    "x-admin-actor": actor,
    "content-type": "application/json",
  });

  async function load() {
    setMessage("Duke ngarkuar…");
    const response = await fetch("/v1/moderation-cases", { headers: headers() });
    if (!response.ok) return setMessage("Autorizimi dështoi. Kontrollo çelësin dhe emrin.");
    const data = (await response.json()) as { cases: ModerationCase[] };
    setCases(data.cases);
    setMessage(`${data.cases.length} raste në radhë.`);
  }

  async function decide(proposalId: string, status: Decision, note: string, duplicateOf: string) {
    const body: { status: Decision; note: string; duplicateOf?: string } = { status, note };
    if (duplicateOf) body.duplicateOf = duplicateOf;
    const response = await fetch(`/v1/proposals/${proposalId}/moderate`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    setMessage(
      response.ok
        ? "Vendimi u regjistrua në gjurmën e auditimit."
        : "Vendimi dështoi. Kontrollo shënimin dhe kërkesat e dy rishikuesve.",
    );
    if (response.ok) await load();
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[var(--kuvend-border)] bg-[var(--kuvend-canvas)]">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <div className="grid size-9 place-items-center rounded-md bg-[var(--kuvend-ink)] text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="font-bold tracking-tight">Kuvend</p>
            <p className="text-xs text-[var(--kuvend-ink-soft)]">Moderimi · zonë e izoluar</p>
          </div>
          <Badge className="ml-auto">Beta eksperimentale</Badge>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Alert>
          <ShieldCheck />
          <AlertTitle>Kufi i veçantë besimi</AlertTitle>
          <AlertDescription>
            Ky panel nuk merr numra telefoni ose dëshmi qytetare. Prodhimi kërkon passkeys/MFA dhe
            miratim nga dy persona.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Hyrja e moderatorit</CardTitle>
            <CardDescription>
              Autentikimi me çelës përdoret vetëm për panelin e izoluar të administrimit.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <Field>
              <Label htmlFor="admin-token">Çelësi lokal</Label>
              <Input
                id="admin-token"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="admin-actor">Emri i moderatorit</Label>
              <Input
                id="admin-actor"
                value={actor}
                onChange={(event) => setActor(event.target.value)}
              />
              <FieldDescription>Emri ruhet në auditim.</FieldDescription>
            </Field>
            <Button onClick={() => void load()}>
              <RefreshCw />
              Ngarko radhën
            </Button>
          </CardContent>
        </Card>
        <div role="status" className="text-sm text-[var(--kuvend-ink-soft)]">
          {message}
        </div>
        {cases.length === 0 ? (
          <Card>
            <CardContent className="grid justify-items-center gap-3 p-10 text-center">
              <CheckCircle2 className="size-6 text-[var(--kuvend-success)]" />
              <CardTitle>Radha është bosh</CardTitle>
              <CardDescription>Nuk ka raste për shqyrtim ose ende nuk je lidhur.</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <section aria-labelledby="queue-title" className="grid gap-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5" />
              <h1 id="queue-title" className="text-xl font-bold">
                Radha e moderimit
              </h1>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {cases.map((item) => (
                <ModerationCaseCard key={item.proposalId} item={item} onDecide={decide} />
              ))}
            </div>
          </section>
        )}
        <InstitutionResponse headers={headers} onMessage={setMessage} />
      </main>
    </div>
  );
}

function ModerationCaseCard({
  item,
  onDecide,
}: {
  item: ModerationCase;
  onDecide: (id: string, status: Decision, note: string, duplicate: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<Decision>("voting_open");
  const [note, setNote] = useState("");
  const [duplicate, setDuplicate] = useState("");
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge>{item.kind}</Badge>
          <Badge>{item.status}</Badge>
        </div>
        <CardTitle className="break-all">{item.proposalId}</CardTitle>
        <CardDescription className="whitespace-pre-line">{item.reason}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Field>
          <Label>Vendimi</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus((value ?? "voting_open") as Decision)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="voting_open">Prano dhe hap votimin</SelectItem>
              <SelectItem value="needs_changes">Kërko ndryshime</SelectItem>
              <SelectItem value="rejected">Refuzo (2 persona)</SelectItem>
              <SelectItem value="duplicate">Dublikatë (2 persona)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <Label htmlFor={`note-${item.proposalId}`}>Arsyeja publike</Label>
          <Textarea
            id={`note-${item.proposalId}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        {status === "duplicate" && (
          <Field>
            <Label htmlFor={`duplicate-${item.proposalId}`}>ID e propozimit kryesor</Label>
            <Input
              id={`duplicate-${item.proposalId}`}
              value={duplicate}
              onChange={(event) => setDuplicate(event.target.value)}
            />
          </Field>
        )}
        <Button
          disabled={note.trim().length < 4}
          onClick={() => void onDecide(item.proposalId, status, note, duplicate)}
        >
          Regjistro vendimin
        </Button>
      </CardContent>
    </Card>
  );
}

function InstitutionResponse({
  headers,
  onMessage,
}: {
  headers: () => Record<string, string>;
  onMessage: (value: string) => void;
}) {
  const [id, setId] = useState("");
  const [institution, setInstitution] = useState("");
  const [status, setStatus] = useState("awaiting_response");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  async function submit() {
    const body = {
      institution,
      status,
      note,
      ...(text && { responseText: text }),
      ...(url && { sourceUrl: url }),
    };
    const response = await fetch(`/v1/proposals/${encodeURIComponent(id)}/institutional-response`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    onMessage(
      response.ok ? "Gjendja institucionale u regjistrua." : "Regjistrimi i përgjigjes dështoi.",
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gjurmimi i institucionit</CardTitle>
        <CardDescription>Regjistro përgjigjen publike pas mbylljes së votimit.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor="response-id">ID e propozimit</Label>
          <Input id="response-id" value={id} onChange={(event) => setId(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="institution">Institucioni</Label>
          <Input
            id="institution"
            value={institution}
            onChange={(event) => setInstitution(event.target.value)}
          />
        </Field>
        <Field>
          <Label>Gjendja</Label>
          <Select value={status} onValueChange={(value) => setStatus(value ?? "awaiting_response")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="awaiting_response">Në pritje</SelectItem>
              <SelectItem value="responded">U përgjigj</SelectItem>
              <SelectItem value="no_response">Pa përgjigje</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="source-url">Burimi zyrtar</Label>
          <Input
            id="source-url"
            type="url"
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="response-text">Teksti i përgjigjes</Label>
          <Textarea
            id="response-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="response-note">Shënimi publik</Label>
          <Textarea
            id="response-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <Button
          className="md:col-start-2"
          disabled={!id || !institution || note.length < 4}
          onClick={() => void submit()}
        >
          Regjistro gjendjen
        </Button>
      </CardContent>
    </Card>
  );
}
