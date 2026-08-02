"use client";

import type { EvidenceItem, ProposalRecord, VoteChoice } from "@kuvend/contracts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog as ShadDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const civicUrl = process.env.NEXT_PUBLIC_CIVIC_API_URL ?? "http://localhost:4000";
const issuerUrl = process.env.NEXT_PUBLIC_ISSUER_URL ?? "http://localhost:4001";
const assistantUrl = process.env.NEXT_PUBLIC_ASSISTANT_URL ?? "http://localhost:4002";
const notificationsUrl = process.env.NEXT_PUBLIC_NOTIFICATIONS_URL ?? "http://localhost:4004";
const categoryLabels: Record<string, string> = {
  community: "Komunitet",
  transport: "Transport",
  environment: "Mjedis",
  governance: "Qeverisje",
  education: "Arsim",
  health: "Shëndetësi",
  economy: "Ekonomi",
  other: "Tjetër",
};

export const fallback: ProposalRecord[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Më shumë hije në stacionet e autobusëve",
    summary: "Stacionet pa hije i ekspozojnë udhëtarët ndaj vapës së verës.",
    problem:
      "Shumë stacione autobusi nuk kanë strehë ose hije. Të moshuarit, fëmijët dhe udhëtarët presin në diell për periudha të gjata.",
    proposedChange:
      "Bashkitë të hartëzojnë stacionet më të përdorura dhe të vendosin strehë me hije, ulëse dhe informacion të qartë për linjat.",
    scope: "national",
    category: "transport",
    evidence: [],
    pseudonym: "Lisi i Qetë",
    status: "voting_open",
    revisionNumber: 1,
    votingRound: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      opensAt: "2026-07-24T09:00:00.000Z",
      closesAt: "2026-08-07T09:00:00.000Z",
      turnout: 428,
    },
    arguments: [
      {
        id: "a1",
        position: "for",
        body: "Një ndërhyrje e vogël që e bën transportin publik më njerëzor.",
        evidence: [],
        pseudonym: "Ura e Hapur",
        createdAt: "2026-07-25T10:00:00.000Z",
      },
      {
        id: "a2",
        position: "against",
        body: "Duhet përcaktuar fillimisht kush mbulon mirëmbajtjen vjetore.",
        evidence: [],
        pseudonym: "Guri i Bardhë",
        createdAt: "2026-07-26T10:00:00.000Z",
      },
    ],
    statusHistory: [
      {
        status: "voting_open",
        at: "2026-07-24T09:00:00.000Z",
        note: "Kaloi kontrollin e moderimit.",
      },
    ],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Kontratat publike në format të hapur",
    summary: "Kontratat duhet të jenë të kërkueshme dhe të ripërdorshme, jo vetëm PDF.",
    problem:
      "Dokumentet publike shpesh publikohen në formate që nuk mund të kërkohen ose analizohen lehtë.",
    proposedChange:
      "Çdo kontratë publike të publikohet edhe si të dhëna të strukturuara me palët, vlerën dhe afatet.",
    scope: "national",
    category: "governance",
    evidence: [],
    pseudonym: "Fjala e Lirë",
    status: "voting_open",
    revisionNumber: 1,
    votingRound: {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      opensAt: "2026-07-28T09:00:00.000Z",
      closesAt: "2026-08-11T09:00:00.000Z",
      turnout: 312,
    },
    arguments: [],
    statusHistory: [
      {
        status: "voting_open",
        at: "2026-07-28T09:00:00.000Z",
        note: "Kaloi kontrollin e moderimit.",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Kalime më të sigurta pranë shkollave",
    summary: "Sinjalistikë dhe ndriçim më i mirë në zonat me fëmijë.",
    problem: "Disa hyrje shkollash nuk kanë kalime të dukshme dhe ngadalësues trafiku.",
    proposedChange:
      "Auditim i sigurisë dhe ndërhyrje prioritare në një rreze prej 300 metrash nga çdo shkollë.",
    scope: "national",
    category: "community",
    evidence: [],
    pseudonym: "Drita e Mëngjesit",
    status: "voting_open",
    revisionNumber: 1,
    votingRound: {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      opensAt: "2026-07-30T09:00:00.000Z",
      closesAt: "2026-08-13T09:00:00.000Z",
      turnout: 187,
    },
    arguments: [],
    statusHistory: [
      {
        status: "voting_open",
        at: "2026-07-30T09:00:00.000Z",
        note: "Kaloi kontrollin e moderimit.",
      },
    ],
  },
];

type Dialog =
  "proposal" | "argument" | "notification" | "otp" | "receipt" | "recovery" | "manage" | null;
type Draft = {
  title: string;
  problem: string;
  proposedChange: string;
  category: string;
  evidence: EvidenceItem[];
};
const emptyDraft: Draft = {
  title: "",
  problem: "",
  proposedChange: "",
  category: "community",
  evidence: [],
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatDate(value: string) {
  const date = new Date(value);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getUTCFullYear()}`;
}

export function KuvendApp({ initialSelectedId }: { initialSelectedId?: string }) {
  const [proposals, setProposals] = useState<ProposalRecord[]>(fallback);
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? fallback[0]!.id);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pendingVote, setPendingVote] = useState<VoteChoice | null>(null);
  const [result, setResult] = useState<{ support: number; oppose: number; turnout: number } | null>(
    null,
  );
  const [receipt, setReceipt] = useState("");
  const [recoverySecret, setRecoverySecret] = useState("");
  const [credential, setCredential] = useState("");
  const [notice, setNotice] = useState("");
  const [afterOtp, setAfterOtp] = useState<"proposal" | "argument" | "vote" | null>(null);
  const [authorCapability, setAuthorCapability] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [displayNow, setDisplayNow] = useState<number | null>(null);

  useEffect(() => {
    setDisplayNow(Date.now());
    setCredential(localStorage.getItem("kuvend.syntheticCredential.v1") ?? "");
    fetch(`${civicUrl}/v1/proposals`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { proposals: ProposalRecord[] }) => setProposals(data.proposals))
      .catch(() => undefined);
  }, []);

  const visible = useMemo(
    () =>
      proposals.filter((proposal) =>
        `${proposal.title} ${proposal.summary}`
          .toLocaleLowerCase("sq-AL")
          .includes(query.toLocaleLowerCase("sq-AL")),
      ),
    [proposals, query],
  );
  const selected = proposals.find((proposal) => proposal.id === selectedId) ?? proposals[0]!;
  const voted = Boolean(result);

  useEffect(() => {
    setAuthorCapability(localStorage.getItem(`kuvend.capability.${selected.id}`) ?? "");
    setReceipt(localStorage.getItem(`kuvend.receipt.${selected.id}`) ?? "");
    setResult(null);
    setPendingVote(null);
  }, [selected.id]);

  function beginVote(choice: VoteChoice) {
    setPendingVote(choice);
    if (!credential) {
      setAfterOtp("vote");
      setDialog("otp");
    }
  }

  async function castVote(activeCredential = credential) {
    if (!pendingVote || !selected.votingRound) return;
    const holder = localStorage.getItem("kuvend.holderSecret.v1") ?? crypto.randomUUID();
    localStorage.setItem("kuvend.holderSecret.v1", holder);
    const nullifier = await sha256(`${holder}:${selected.votingRound.id}`);
    const commitment = await sha256(`${crypto.randomUUID()}:${pendingVote}`);
    const response = await fetch(`${civicUrl}/v1/ballots`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        proposalId: selected.id,
        roundId: selected.votingRound.id,
        choice: pendingVote,
        credential: activeCredential,
        nullifier,
        receiptCommitment: commitment,
      }),
    });
    if (!response.ok) {
      setNotice("Vota nuk u regjistrua. Mund të jetë votuar më parë nga kjo dëshmi.");
      return;
    }
    const data = (await response.json()) as {
      receipt: string;
      result: { support: number; oppose: number; turnout: number };
    };
    setResult(data.result);
    setReceipt(data.receipt);
    localStorage.setItem(`kuvend.receipt.${selected.id}`, data.receipt);
    setDialog("receipt");
    setNotice("");
  }

  async function shareProposal() {
    const url = `${location.origin}/propozime/${selected.id}`;
    if (navigator.share)
      await navigator.share({
        title: selected.title,
        text: `${selected.summary} — Votim këshillues në Kuvend`,
        url,
      });
    else {
      await navigator.clipboard.writeText(url);
      setNotice("Lidhja e propozimit u kopjua.");
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Kuvend, kreu">
          <img src="/mark.svg" alt="" />
          <span>Kuvend</span>
        </a>
        <nav aria-label="Kryesor">
          <a href="#propozimet">Propozimet</a>
          <a href="#si-funksionon">Si funksionon</a>
          <a href="#transparenca">Transparenca</a>
        </nav>
        <Button
          variant="ghost"
          size="sm"
          className="notification-link"
          onClick={() => setDialog("notification")}
        >
          <Bell data-icon="inline-start" /> Njoftimet
        </Button>
        <Button size="lg" className="compact" onClick={() => setDialog("proposal")}>
          <Plus data-icon="inline-start" /> Bëj një propozim
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="menu-button"
          aria-label={menuOpen ? "Mbyll menunë" : "Hap menunë"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </header>
      {menuOpen && (
        <nav className="mobile-menu" aria-label="Menuja celulare">
          <a href="#propozimet" onClick={() => setMenuOpen(false)}>
            Propozimet
          </a>
          <a href="#si-funksionon" onClick={() => setMenuOpen(false)}>
            Si funksionon
          </a>
          <button
            onClick={() => {
              setMenuOpen(false);
              setDialog("notification");
            }}
          >
            Njoftimet
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              setDialog("proposal");
            }}
          >
            Bëj një propozim
          </button>
        </nav>
      )}

      <section className="identity-strip" id="top">
        <ShieldCheck size={17} />
        <strong>I pavarur dhe joqeveritar.</strong>
        <span>
          Rezultatet janë këshilluese; nuk përfaqësojnë qytetarët ose banorët e Shqipërisë.
        </span>
      </section>

      <main>
        <section className="hero">
          <div>
            <span className="eyebrow">Fjala jote, në tryezë</span>
            <h1>
              Ide të qarta.
              <br />
              <em>Vendime të hapura.</em>
            </h1>
            <p>
              Propozo një ndryshim për Shqipërinë. Kuvend të ndihmon ta bësh të kuptueshëm, pastaj
              komuniteti argumenton dhe voton.
            </p>
            <div className="hero-actions">
              <Button size="lg" onClick={() => setDialog("proposal")}>
                <Plus data-icon="inline-start" /> Bëj një propozim
              </Button>
              <a className="text-link" href="#si-funksionon">
                Shih si funksionon <ChevronRight size={18} />
              </a>
            </div>
          </div>
          <aside className="trust-card">
            <LockKeyhole />
            <div>
              <strong>Vota pa emër</strong>
              <p>
                Telefoni verifikohet nga një shërbim i izoluar. Shërbimi i votimit nuk e merr
                numrin.
              </p>
            </div>
          </aside>
        </section>

        <section className="proposal-area" id="propozimet">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Ide, votime dhe rezultate</span>
              <h2>Propozimet</h2>
            </div>
            <div className="search">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Kërko propozime"
                placeholder="Kërko propozime"
              />
            </div>
          </div>
          <div className="proposal-grid">
            <div className={`proposal-list ${selected ? "has-selection" : ""}`}>
              {visible.map((proposal) => (
                <button
                  key={proposal.id}
                  className={`proposal-card ${proposal.id === selected.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedId(proposal.id);
                    history.replaceState(null, "", `/propozime/${proposal.id}`);
                    setResult(null);
                  }}
                >
                  <div className="card-top">
                    <span className="tag">{categoryLabels[proposal.category] ?? "Tjetër"}</span>
                    <span className="time">
                      <Clock3 size={14} />{" "}
                      {proposal.status === "voting_open" && proposal.votingRound
                        ? displayNow === null
                          ? "Votimi i hapur"
                          : `edhe ${Math.max(
                              1,
                              Math.ceil(
                                (new Date(proposal.votingRound.closesAt).getTime() - displayNow) /
                                  86400000,
                              ),
                            )} ditë`
                        : statusLabel(proposal.status)}
                    </span>
                  </div>
                  <h3>{proposal.title}</h3>
                  <p>{proposal.summary}</p>
                  <div className="card-foot">
                    <span>
                      <Users size={15} />
                      {proposal.votingRound?.turnout ?? 0} pjesëmarrës
                    </span>
                    <ChevronRight size={18} />
                  </div>
                </button>
              ))}
            </div>
            <article className="proposal-detail">
              <button
                className="mobile-back"
                onClick={() => document.querySelector(".proposal-list")?.scrollIntoView()}
              >
                <ArrowLeft size={17} /> Të gjitha propozimet
              </button>
              <div className="detail-meta">
                <Badge variant="secondary">{categoryLabels[selected.category] ?? "Tjetër"}</Badge>
                <Badge variant="outline">{statusLabel(selected.status)}</Badge>
                <span>Propozuar nga {selected.publicAuthorName ?? selected.pseudonym}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="share-button"
                  onClick={() => void shareProposal()}
                >
                  <Share2 data-icon="inline-start" /> Shpërndaje
                </Button>
                {authorCapability && (
                  <Button variant="outline" size="sm" onClick={() => setDialog("manage")}>
                    Menaxho
                  </Button>
                )}
              </div>
              <h2>{selected.title}</h2>
              <section>
                <h4>Problemi</h4>
                <p>{selected.problem}</p>
              </section>
              <section>
                <h4>Ndryshimi i propozuar</h4>
                <p>{selected.proposedChange}</p>
              </section>
              {selected.evidence.length > 0 && (
                <section>
                  <h4>Prova dhe media</h4>
                  <EvidenceList items={selected.evidence} />
                </section>
              )}
              <div className="argument-row">
                <div>
                  <span className="argument-label for">
                    <Check size={15} /> Argumente pro
                  </span>
                  <strong>
                    {selected.arguments.filter((argument) => argument.position === "for").length}
                  </strong>
                </div>
                <div>
                  <span className="argument-label against">
                    <X size={15} /> Argumente kundër
                  </span>
                  <strong>
                    {
                      selected.arguments.filter((argument) => argument.position === "against")
                        .length
                    }
                  </strong>
                </div>
                <button aria-label="Shto argument" onClick={() => setDialog("argument")}>
                  <MessageSquareText />
                </button>
              </div>
              {selected.arguments.length > 0 && (
                <div className="argument-samples">
                  {selected.arguments.slice(0, 2).map((argument) => (
                    <blockquote key={argument.id} className={argument.position}>
                      <span>{argument.position === "for" ? "Pro" : "Kundër"}</span>
                      {argument.body}
                      <cite>{argument.pseudonym}</cite>
                      {argument.evidence.length > 0 && <EvidenceList items={argument.evidence} />}
                    </blockquote>
                  ))}
                </div>
              )}
              <section>
                <h4>Historiku</h4>
                <ol className="status-timeline">
                  {selected.statusHistory.map((event, index) => (
                    <li key={`${event.at}-${index}`}>
                      <strong>{statusLabel(event.status)}</strong>
                      <span>{formatDate(event.at)}</span>
                      {event.note && <p>{event.note}</p>}
                    </li>
                  ))}
                </ol>
              </section>
              {selected.institutionalResponse && (
                <section className="institutional-response">
                  <h4>Përgjigjja institucionale</h4>
                  <p>
                    <strong>{selected.institutionalResponse.institution}</strong> —{" "}
                    {responseStatusLabel(selected.institutionalResponse.status)}
                  </p>
                  {selected.institutionalResponse.responseText && (
                    <p>{selected.institutionalResponse.responseText}</p>
                  )}
                  {selected.institutionalResponse.sourceUrl && (
                    <a
                      href={selected.institutionalResponse.sourceUrl}
                      target="_blank"
                      rel="noreferrer nofollow"
                    >
                      Shiko burimin zyrtar
                    </a>
                  )}
                </section>
              )}
              <div className="vote-box">
                {selected.status !== "voting_open" && selected.closedResult ? (
                  <VoteResult result={selected.closedResult} />
                ) : selected.status !== "voting_open" ? (
                  <div className="moderation-state">
                    <Clock3 />
                    <div>
                      <strong>{statusLabel(selected.status)}</strong>
                      <p>
                        {selected.status === "duplicate" && selected.duplicateOf
                          ? "Ky propozim lidhet me një propozim ekzistues. Mund ta apelosh me sekretin e rikuperimit."
                          : "Shiko historikun më sipër për arsyen dhe hapat e ardhshëm."}
                      </p>
                      {selected.status === "duplicate" && selected.duplicateOf && (
                        <a href={`/propozime/${selected.duplicateOf}`}>Shiko propozimin kryesor</a>
                      )}
                    </div>
                  </div>
                ) : !voted ? (
                  <>
                    <div className="turnout">
                      <Users />
                      <div>
                        <strong>{selected.votingRound?.turnout ?? 0} pjesëmarrës</strong>
                        <span>Rezultati shfaqet pasi të votosh</span>
                      </div>
                    </div>
                    <div className="vote-buttons">
                      <button
                        className={pendingVote === "support" ? "support active" : "support"}
                        onClick={() => beginVote("support")}
                      >
                        <Check /> Mbështes
                      </button>
                      <button
                        className={pendingVote === "oppose" ? "oppose active" : "oppose"}
                        onClick={() => beginVote("oppose")}
                      >
                        <X /> Kundërshtoj
                      </button>
                    </div>
                    {pendingVote && credential && (
                      <button className="primary confirm" onClick={() => void castVote()}>
                        Konfirmo votën përfundimtare
                      </button>
                    )}
                    <p className="fineprint">
                      <LockKeyhole size={13} /> Vota është përfundimtare dhe këshilluese.
                    </p>
                  </>
                ) : (
                  <VoteResult result={result!} />
                )}
                {notice && (
                  <p className="error" role="alert">
                    {notice}
                  </p>
                )}
                {receipt && dialog !== "receipt" && (
                  <Button variant="ghost" className="w-full" onClick={() => setDialog("receipt")}>
                    Shiko mandatin tim
                  </Button>
                )}
              </div>
            </article>
          </div>
        </section>

        <section className="how" id="si-funksionon">
          <span className="eyebrow">E thjeshtë dhe e shpjegueshme</span>
          <h2>Nga ideja te përgjigjja</h2>
          <div className="steps">
            <div>
              <b>1</b>
              <h3>Propozo</h3>
              <p>Shkruaj ose dikto idenë. Ndihma gjuhësore është gjithmonë opsionale.</p>
            </div>
            <div>
              <b>2</b>
              <h3>Shqyrtohet</h3>
              <p>Brenda 72 orësh kontrollohen siguria, privatësia dhe dublikatat.</p>
            </div>
            <div>
              <b>3</b>
              <h3>Votohet</h3>
              <p>Çdo propozim i pranueshëm qëndron hapur 14 ditë dhe dy fundjava.</p>
            </div>
            <div>
              <b>4</b>
              <h3>Ndiqet</h3>
              <p>Rezultati i dërgohet institucionit dhe përgjigjja publikohet.</p>
            </div>
          </div>
        </section>
      </main>

      <footer id="transparenca">
        <div>
          <a className="brand inverse" href="#top">
            <img src="/mark.svg" alt="" />
            <span>Kuvend</span>
          </a>
          <p>Infrastrukturë qytetare e hapur, e pavarur dhe jofitimprurëse.</p>
        </div>
        <div>
          <strong>Transparenca</strong>
          <a href="/transparenca">Transparenca dhe financimi</a>
          <a href="/privatesia">Privatësia</a>
          <a href="/kushtet">Kushtet</a>
          <a href="/moderimi">Moderimi</a>
        </div>
        <div>
          <strong>Kujdes</strong>
          <p>Beta përdor dëshmi sintetike. Nuk është votim zgjedhor apo përfaqësues.</p>
        </div>
      </footer>

      {dialog === "proposal" && (
        <ProposalDialog
          credential={credential}
          onNeedCredential={(draft) => {
            sessionStorage.setItem("kuvend.pendingDraft.v1", JSON.stringify(draft));
            setAfterOtp("proposal");
            setDialog("otp");
          }}
          onClose={() => setDialog(null)}
          onCreated={(proposal, secret) => {
            sessionStorage.removeItem("kuvend.pendingDraft.v1");
            setProposals((items) => [proposal, ...items]);
            setSelectedId(proposal.id);
            setRecoverySecret(secret);
            setDialog("recovery");
          }}
        />
      )}
      {dialog === "argument" && (
        <ArgumentDialog
          proposal={selected}
          credential={credential}
          onNeedCredential={(body, position) => {
            sessionStorage.setItem("kuvend.pendingArgument.v1", JSON.stringify({ body, position }));
            setAfterOtp("argument");
            setDialog("otp");
          }}
          onClose={() => setDialog(null)}
          onCreated={(argument) => {
            sessionStorage.removeItem("kuvend.pendingArgument.v1");
            setProposals((items) =>
              items.map((proposal) =>
                proposal.id === selected.id
                  ? { ...proposal, arguments: [...proposal.arguments, argument] }
                  : proposal,
              ),
            );
            setDialog(null);
          }}
        />
      )}
      {dialog === "notification" && <NotificationDialog onClose={() => setDialog(null)} />}
      {dialog === "otp" && (
        <OtpDialog
          onClose={() => setDialog(null)}
          onVerified={(value) => {
            localStorage.setItem("kuvend.syntheticCredential.v1", value);
            setCredential(value);
            setDialog(
              afterOtp === "proposal" ? "proposal" : afterOtp === "argument" ? "argument" : null,
            );
            setAfterOtp(null);
          }}
        />
      )}
      {dialog === "receipt" && (
        <ReceiptDialog proposalId={selected.id} receipt={receipt} onClose={() => setDialog(null)} />
      )}
      {dialog === "recovery" && (
        <RecoveryDialog secret={recoverySecret} onClose={() => setDialog(null)} />
      )}
      {dialog === "manage" && (
        <ManageProposalDialog
          proposal={selected}
          capabilitySecret={authorCapability}
          onClose={() => setDialog(null)}
          onUpdated={(proposal) => {
            setProposals((items) =>
              items.map((item) => (item.id === proposal.id ? proposal : item)),
            );
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

function statusLabel(status: ProposalRecord["status"]) {
  return (
    {
      pending_review: "Në shqyrtim",
      needs_changes: "Kërkon ndryshime",
      voting_open: "Votimi i hapur",
      rejected: "Refuzuar",
      duplicate: "Dublikatë",
      withdrawn: "Tërhequr",
      voting_closed: "Votimi i mbyllur",
      awaiting_response: "Në pritje të përgjigjes",
      responded: "Me përgjigje",
      no_response: "Pa përgjigje",
    } satisfies Record<ProposalRecord["status"], string>
  )[status];
}

function responseStatusLabel(
  status: NonNullable<ProposalRecord["institutionalResponse"]>["status"],
) {
  return {
    awaiting_response: "në pritje të përgjigjes",
    responded: "është përgjigjur",
    no_response: "nuk është përgjigjur",
  }[status];
}

function VoteResult({ result }: { result: { support: number; oppose: number; turnout: number } }) {
  const percent = result.turnout ? Math.round((result.support / result.turnout) * 100) : 0;
  return (
    <div className="result">
      <span className="eyebrow">Vota u regjistrua</span>
      <div className="result-head">
        <strong>{percent}% mbështesin</strong>
        <span>{result.turnout} pjesëmarrës</span>
      </div>
      <div className="result-bar">
        <i style={{ width: `${percent}%` }} />
      </div>
      <div className="result-legend">
        <span>{result.support} mbështesin</span>
        <span>{result.oppose} kundërshtojnë</span>
      </div>
    </div>
  );
}

function DialogShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <ShadDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <Badge variant="secondary">Kuvend</Badge>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </ShadDialog>
  );
}

function OtpDialog({
  onClose,
  onVerified,
}: {
  onClose: () => void;
  onVerified: (credential: string) => void;
}) {
  const [phone, setPhone] = useState("+355");
  const [challenge, setChallenge] = useState("");
  const [code, setCode] = useState("");
  const [otpProvider, setOtpProvider] = useState<"synthetic" | "prelude">("synthetic");
  const [error, setError] = useState("");
  async function start() {
    const response = await fetch(`${issuerUrl}/v1/otp/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await response.json();
    if (!response.ok) {
      return setError(
        data.error === "verification_blocked" || data.error === "too_many_attempts"
          ? "Nuk mund të dërgohet një kod tani. Provo përsëri më vonë."
          : "Kontrollo numrin në format ndërkombëtar, p.sh. +355...",
      );
    }
    setChallenge(data.challengeId);
    setOtpProvider(data.otpProvider === "prelude" ? "prelude" : "synthetic");
    setError("");
  }
  async function check() {
    const response = await fetch(`${issuerUrl}/v1/otp/check`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ challengeId: challenge, phone, code }),
    });
    const data = await response.json();
    if (!response.ok) {
      return setError(
        data.error === "challenge_expired"
          ? "Kodi ka skaduar. Mbylle këtë dritare dhe kërko një kod të ri."
          : "Kodi nuk është i saktë.",
      );
    }
    onVerified(data.credential);
  }
  return (
    <DialogShell
      title="Verifiko telefonin"
      subtitle="Një verifikim jep një dëshmi 30-ditore për pjesëmarrje."
      onClose={onClose}
    >
      <div className="privacy-callout">
        <ShieldCheck />
        <p>
          <strong>Kufiri i privatësisë</strong> Shërbimi i propozimeve dhe votimit nuk e merr
          numrin. Në këtë beta, shërbimi i izoluar i Kuvend dhe ofruesi SMS do ta përpunonin
          përkohësisht.
        </p>
      </div>
      {!challenge ? (
        <>
          <label>
            Numri i telefonit
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              autoFocus
            />
          </label>
          <button className="primary full" onClick={() => void start()}>
            Dërgo kodin
          </button>
        </>
      ) : (
        <>
          <label>
            Kodi gjashtëshifror
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              maxLength={6}
              autoFocus
              placeholder="123456"
            />
          </label>
          {otpProvider === "synthetic" && (
            <p className="dev-note">
              Beta sintetike: përdor kodin <strong>123456</strong>.
            </p>
          )}
          <button className="primary full" onClick={() => void check()}>
            Verifiko dhe vazhdo
          </button>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </DialogShell>
  );
}

function ProposalDialog({
  credential,
  onNeedCredential,
  onClose,
  onCreated,
}: {
  credential: string;
  onNeedCredential: (draft: Draft) => void;
  onClose: () => void;
  onCreated: (proposal: ProposalRecord, secret: string) => void;
}) {
  const savedDraft = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("kuvend.pendingDraft.v1") ?? "null") as Draft | null;
    } catch {
      return null;
    }
  })();
  const [draft, setDraft] = useState<Draft>(savedDraft ?? emptyDraft);
  const [step, setStep] = useState(savedDraft && credential ? 6 : 1);
  const [suggestion, setSuggestion] = useState<Draft | null>(null);
  const [duplicates, setDuplicates] = useState<Array<{ id: string; title: string; score: number }>>(
    [],
  );
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function improve() {
    const response = await fetch(`${assistantUrl}/v1/assist`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        problem: draft.problem,
        proposedChange: draft.proposedChange,
        locale: "sq",
      }),
    });
    if (!response.ok) return setError("Plotëso problemin dhe ndryshimin para se të vazhdosh.");
    const data = await response.json();
    setSuggestion({ ...draft, ...data.suggestion });
    const duplicateResponse = await fetch(`${assistantUrl}/v1/duplicates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: draft.title, problem: draft.problem }),
    });
    setDuplicates((await duplicateResponse.json()).suggestions ?? []);
    setStep(5);
    setError("");
  }
  async function submit() {
    if (!credential) return onNeedCredential(draft);
    const capabilitySecret = crypto.randomUUID();
    const authorCapabilityHash = await sha256(capabilitySecret);
    const response = await fetch(`${civicUrl}/v1/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...draft, scope: "national", credential, authorCapabilityHash }),
    });
    if (!response.ok)
      return setError(
        "Propozimi nuk u dërgua. Kontrollo që titulli dhe shpjegimi janë mjaftueshëm të plotë.",
      );
    const data = await response.json();
    localStorage.setItem(`kuvend.capability.${data.proposal.id}`, capabilitySecret);
    onCreated(data.proposal, capabilitySecret);
  }
  const headings = [
    "Jepi një titull",
    "Përshkruaj problemin",
    "Propozo ndryshimin",
    "Shto hollësitë",
    "Rishiko ndihmën",
    "Konfirmo propozimin",
  ];
  const canContinue =
    step === 1
      ? draft.title.trim().length >= 8
      : step === 2
        ? draft.problem.trim().length >= 30
        : step === 3
          ? draft.proposedChange.trim().length >= 30
          : true;
  return (
    <DialogShell
      title={headings[step - 1] ?? "Bëj një propozim"}
      subtitle="Një hap në herë. Asgjë nuk publikohet pa konfirmimin tënd."
      onClose={onClose}
    >
      <Progress value={(step / 6) * 100}>
        <ProgressLabel>Hapi {step} nga 6</ProgressLabel>
        <ProgressValue />
      </Progress>
      <div className="wizard-body">
        {step === 1 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="proposal-title">Çfarë dëshiron të ndryshojë?</FieldLabel>
              <Input
                id="proposal-title"
                value={draft.title}
                onChange={(event) => field("title", event.target.value)}
                placeholder="P.sh. Kalime më të sigurta pranë shkollave"
                autoFocus
              />
              <FieldDescription>Një fjali e shkurtër dhe konkrete.</FieldDescription>
            </Field>
          </FieldGroup>
        )}
        {step === 2 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="proposal-problem">Cili është problemi sot?</FieldLabel>
              <Textarea
                id="proposal-problem"
                value={draft.problem}
                onChange={(event) => field("problem", event.target.value)}
                placeholder="Shpjegoje me fjalët e tua…"
                autoFocus
              />
              <FieldDescription>
                Thuaj kë prek dhe pse ka rëndësi. Të paktën 30 shkronja.
              </FieldDescription>
            </Field>
          </FieldGroup>
        )}
        {step === 3 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="proposal-change">Çfarë duhet të ndryshojë?</FieldLabel>
              <Textarea
                id="proposal-change"
                value={draft.proposedChange}
                onChange={(event) => field("proposedChange", event.target.value)}
                placeholder="Përshkruaj veprimin konkret…"
                autoFocus
              />
              <FieldDescription>Shpjego kush duhet të bëjë çfarë.</FieldDescription>
            </Field>
          </FieldGroup>
        )}
        {step === 4 && (
          <FieldGroup>
            <Field>
              <FieldLabel>Kategoria</FieldLabel>
              <Select
                value={draft.category}
                onValueChange={(value) => field("category", value ?? "community")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) => categoryLabels[String(value)] ?? String(value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="community">Komunitet</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="environment">Mjedis</SelectItem>
                    <SelectItem value="governance">Qeverisje</SelectItem>
                    <SelectItem value="education">Arsim</SelectItem>
                    <SelectItem value="health">Shëndetësi</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Provat dhe media janë opsionale.</FieldDescription>
            </Field>
            <EvidenceEditor
              items={draft.evidence}
              onChange={(items) => field("evidence", items)}
              limit={8}
            />
          </FieldGroup>
        )}
        {step === 5 && (
          <>
            <Alert>
              <CircleHelp />
              <AlertTitle>AI sugjeron; ti vendos</AlertTitle>
              <AlertDescription>
                Origjinali ruhet dhe kuptimi politik nuk duhet të ndryshojë.
              </AlertDescription>
            </Alert>
            <div className="compare">
              <section>
                <Badge variant="outline">Teksti yt</Badge>
                <h3>{draft.title}</h3>
                <p>{draft.problem}</p>
                <p>{draft.proposedChange}</p>
              </section>
              <section className="suggested">
                <Badge variant="secondary">Sugjerim gjuhësor</Badge>
                <h3>{suggestion?.title}</h3>
                <p>{suggestion?.problem}</p>
                <p>{suggestion?.proposedChange}</p>
              </section>
            </div>
            {duplicates.length > 0 && (
              <Alert>
                <CircleHelp />
                <AlertTitle>Mund të ngjajë me një propozim ekzistues</AlertTitle>
                <AlertDescription>
                  {duplicates.map((item) => (
                    <span key={item.id}>
                      {item.title} ({Math.round(item.score * 100)}%)
                    </span>
                  ))}{" "}
                  Asgjë nuk bashkohet automatikisht.
                </AlertDescription>
              </Alert>
            )}
            <div className="choice-actions">
              <Button variant="outline" onClick={() => setStep(6)}>
                Mbaj tekstin tim
              </Button>
              <Button
                onClick={() => {
                  if (suggestion) setDraft(suggestion);
                  setStep(6);
                }}
              >
                Përdor sugjerimin
              </Button>
            </div>
          </>
        )}
        {step === 6 && (
          <>
            <div className="final-review">
              <div>
                <span>Titulli</span>
                <strong>{draft.title}</strong>
              </div>
              <div>
                <span>Problemi</span>
                <p>{draft.problem}</p>
              </div>
              <div>
                <span>Ndryshimi</span>
                <p>{draft.proposedChange}</p>
              </div>
              <div>
                <span>Kategoria</span>
                <Badge variant="secondary">
                  {categoryLabels[draft.category] ?? draft.category}
                </Badge>
              </div>
              {draft.evidence.length > 0 && (
                <div>
                  <span>Prova dhe media</span>
                  <EvidenceList items={draft.evidence} />
                </div>
              )}
            </div>
            <label className="confirm-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>
                <strong>E konfirmoj këtë version.</strong> E kuptoj se do të shqyrtohet nga
                moderatorët dhe, nëse pranohet, do të hyjë në votim këshillues 14-ditor.
              </span>
            </label>
          </>
        )}
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Nuk mund të vazhdohet</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="wizard-footer">
        <Button
          variant="outline"
          disabled={step === 1}
          onClick={() => setStep((current) => Math.max(1, current - 1))}
        >
          Kthehu
        </Button>
        {step < 4 && (
          <Button disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
            Vazhdo <ChevronRight data-icon="inline-end" />
          </Button>
        )}
        {step === 4 && (
          <Button onClick={() => void improve()}>
            Rishiko me ndihmën opsionale <ChevronRight data-icon="inline-end" />
          </Button>
        )}
        {step === 6 && (
          <Button disabled={!confirmed} onClick={() => void submit()}>
            <Check data-icon="inline-start" /> Konfirmo dhe dorëzo
          </Button>
        )}
      </div>
    </DialogShell>
  );
}

function ReceiptDialog({
  proposalId,
  receipt,
  onClose,
}: {
  proposalId: string;
  receipt: string;
  onClose: () => void;
}) {
  const [verification, setVerification] = useState<"idle" | "included" | "missing" | "open">(
    "idle",
  );

  async function verify() {
    const response = await fetch(`${civicUrl}/v1/proposals/${proposalId}/commitments`);
    if (response.status === 403) return setVerification("open");
    if (!response.ok) return setVerification("missing");
    const data = (await response.json()) as { receipts: string[] };
    setVerification(data.receipts.includes(receipt) ? "included" : "missing");
  }

  function download() {
    const url = URL.createObjectURL(
      new Blob([`Kuvend — mandati i votës\n\nPropozimi: ${proposalId}\nMandati: ${receipt}\n`], {
        type: "text/plain",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kuvend-mandati-i-votes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <DialogShell
      title="Vota u përfshi"
      subtitle="Ruaje këtë mandat për të verifikuar përfshirjen pas mbylljes së votimit."
      onClose={onClose}
    >
      <div className="receipt">
        <Check />
        <code>{receipt}</code>
      </div>
      <div className="dialog-actions">
        <button className="secondary" onClick={download}>
          Shkarko
        </button>
        <button className="primary" onClick={() => void verify()}>
          Verifiko përfshirjen
        </button>
      </div>
      {verification === "included" && (
        <div className="subscription-success">
          <Check /> Mandati gjendet në listën e nënshkruar.
        </div>
      )}
      {verification === "open" && (
        <p className="fineprint">Lista publikohet sapo të mbyllet votimi.</p>
      )}
      {verification === "missing" && (
        <p className="error">Mandati nuk u gjet në listën e publikuar.</p>
      )}
    </DialogShell>
  );
}

function RecoveryDialog({ secret, onClose }: { secret: string; onClose: () => void }) {
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [
          `Kuvend — sekreti i rikuperimit\n\n${secret}\n\nRuaje privatisht. Kuvend nuk mund ta rikuperojë.`,
        ],
        { type: "text/plain" },
      ),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kuvend-sekreti-i-rikuperimit.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <DialogShell
      title="Ruaj sekretin e rikuperimit"
      subtitle="Ky është çelësi i vetëm për ndryshim, tërheqje ose apel. Kuvend nuk mund ta gjejë përmes telefonit."
      onClose={onClose}
    >
      <div className="receipt">
        <LockKeyhole />
        <code>{secret}</code>
      </div>
      <div className="dialog-actions">
        <button className="secondary" onClick={() => void navigator.clipboard.writeText(secret)}>
          Kopjo
        </button>
        <button className="primary" onClick={download}>
          Shkarko dhe vazhdo
        </button>
      </div>
    </DialogShell>
  );
}

function ManageProposalDialog({
  proposal,
  capabilitySecret,
  onClose,
  onUpdated,
}: {
  proposal: ProposalRecord;
  capabilitySecret: string;
  onClose: () => void;
  onUpdated: (proposal: ProposalRecord) => void;
}) {
  const canRevise = proposal.status === "pending_review" || proposal.status === "needs_changes";
  const canAppeal = proposal.status === "rejected" || proposal.status === "duplicate";
  const canWithdraw = canRevise;
  const [action, setAction] = useState<"revise" | "withdraw" | "appeal">(
    canRevise ? "revise" : canAppeal ? "appeal" : "withdraw",
  );
  const [title, setTitle] = useState(proposal.title);
  const [problem, setProblem] = useState(proposal.problem);
  const [proposedChange, setProposedChange] = useState(proposal.proposedChange);
  const [category, setCategory] = useState(proposal.category);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(proposal.evidence);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "working" | "appealed" | "error">("idle");

  async function submit() {
    setState("working");
    const endpoint =
      action === "revise" ? "revise" : action === "withdraw" ? "withdraw" : "appeals";
    const body =
      action === "revise"
        ? {
            capabilitySecret,
            title,
            problem,
            proposedChange,
            category,
            evidence,
            revisionNote: reason,
          }
        : { capabilitySecret, reason };
    const response = await fetch(`${civicUrl}/v1/proposals/${proposal.id}/${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return setState("error");
    const data = (await response.json()) as { proposal?: ProposalRecord };
    if (data.proposal) onUpdated(data.proposal);
    else setState("appealed");
  }

  return (
    <DialogShell
      title="Menaxho propozimin"
      subtitle={`Sekreti privat vërteton autorësinë pa e lidhur propozimin me telefonin. Versioni ${proposal.revisionNumber}.`}
      onClose={onClose}
    >
      <div className="position-tabs">
        {canRevise && (
          <button
            className={action === "revise" ? "selected" : ""}
            onClick={() => setAction("revise")}
          >
            Ndrysho
          </button>
        )}
        {canWithdraw && (
          <button
            className={action === "withdraw" ? "selected" : ""}
            onClick={() => setAction("withdraw")}
          >
            Tërhiqe
          </button>
        )}
        {canAppeal && (
          <button
            className={action === "appeal" ? "selected" : ""}
            onClick={() => setAction("appeal")}
          >
            Apelo
          </button>
        )}
      </div>
      {action === "revise" ? (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="manage-title">Titulli</FieldLabel>
            <Input
              id="manage-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="manage-problem">Problemi</FieldLabel>
            <Textarea
              id="manage-problem"
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="manage-change">Ndryshimi i propozuar</FieldLabel>
            <Textarea
              id="manage-change"
              value={proposedChange}
              onChange={(event) => setProposedChange(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="manage-category">Kategoria</FieldLabel>
            <select
              id="manage-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as ProposalRecord["category"])}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <EvidenceEditor items={evidence} onChange={setEvidence} limit={8} />
        </FieldGroup>
      ) : (
        <Alert>
          <AlertTitle>
            {action === "appeal"
              ? "Apeli shqyrtohet nga dy moderatorë"
              : "Tërheqja është përfundimtare"}
          </AlertTitle>
          <AlertDescription>
            {action === "appeal"
              ? "Shpjego konkretisht pse vendimi duhet rishikuar."
              : "Propozimi mbetet në historikun publik si i tërhequr."}
          </AlertDescription>
        </Alert>
      )}
      <Field>
        <FieldLabel htmlFor="manage-reason">
          {action === "revise" ? "Çfarë ndryshove?" : "Arsyeja"}
        </FieldLabel>
        <Textarea
          id="manage-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={action === "appeal" ? "Të paktën 30 shkronja…" : "Të paktën 8 shkronja…"}
        />
      </Field>
      {state === "appealed" ? (
        <div className="subscription-success">
          <Check /> Apeli u dorëzua për shqyrtim.
        </div>
      ) : (
        <Button className="w-full" disabled={state === "working"} onClick={() => void submit()}>
          {state === "working" ? "Duke ruajtur…" : "Konfirmo veprimin"}
        </Button>
      )}
      {state === "error" && (
        <p className="error">Veprimi nuk u krye. Kontrollo fushat dhe provo përsëri.</p>
      )}
    </DialogShell>
  );
}

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function NotificationDialog({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    try {
      setCategories(JSON.parse(localStorage.getItem("kuvend.notificationCategories.v1") ?? "[]"));
    } catch {
      setCategories([]);
    }
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => subscription && setState("done"))
      .catch(() => undefined);
  }, []);

  async function subscribe() {
    setState("working");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        throw new Error("unsupported");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("denied");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const config = (await fetch(`${notificationsUrl}/v1/config`).then((response) =>
        response.json(),
      )) as { publicKey: string };
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(config.publicKey),
        }));
      const json = subscription.toJSON();
      const response = await fetch(`${notificationsUrl}/v1/subscriptions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          expirationTime: json.expirationTime,
          keys: json.keys,
          categories,
        }),
      });
      if (!response.ok) throw new Error("failed");
      localStorage.setItem("kuvend.notificationCategories.v1", JSON.stringify(categories));
      setState("done");
    } catch {
      setState("error");
    }
  }

  async function unsubscribe() {
    setState("working");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch(`${notificationsUrl}/v1/subscriptions`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      localStorage.removeItem("kuvend.notificationCategories.v1");
      setState("idle");
    } catch {
      setState("error");
    }
  }
  return (
    <DialogShell
      title="Merr njoftime për votime të reja"
      subtitle="Njoftimet janë vullnetare dhe të ndara nga propozimet, argumentet dhe votat e tua."
      onClose={onClose}
    >
      <div className="privacy-callout">
        <Bell />
        <p>
          <strong>Pa profil anëtari</strong> Shërbimi ruan vetëm adresën teknike të njoftimit dhe
          temat që zgjedh. Nuk merr numër telefoni, votë, dëshmi ose identifikues qytetar.
        </p>
      </div>
      <p>
        Mund t’i çaktivizosh kurdoherë në cilësimet e shfletuesit. Për një alternativë pa leje
        shfletuesi, përdor <a href="/feed.xml">RSS-in publik</a>.
      </p>
      <fieldset className="notification-topics">
        <legend>Temat që dëshiron</legend>
        <p>Lëri të gjitha bosh për çdo votim të ri.</p>
        <div>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <label key={value}>
              <input
                type="checkbox"
                checked={categories.includes(value)}
                onChange={(event) =>
                  setCategories((items) =>
                    event.target.checked
                      ? [...items, value]
                      : items.filter((item) => item !== value),
                  )
                }
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        className="primary full"
        disabled={state === "working"}
        onClick={() => void subscribe()}
      >
        {state === "working"
          ? "Duke ruajtur…"
          : state === "done"
            ? "Ruaj temat"
            : "Aktivizo njoftimet"}
      </button>
      {state === "done" && (
        <>
          <div className="subscription-success">
            <Check /> Njoftimet janë aktive.
          </div>
          <Button variant="ghost" className="w-full" onClick={() => void unsubscribe()}>
            Çaktivizo njoftimet
          </Button>
        </>
      )}
      {state === "error" && (
        <p className="error">Shfletuesi nuk e lejoi njoftimin. Mund të ndjekësh RSS-in publik.</p>
      )}
    </DialogShell>
  );
}

function ArgumentDialog({
  proposal,
  credential,
  onNeedCredential,
  onClose,
  onCreated,
}: {
  proposal: ProposalRecord;
  credential: string;
  onNeedCredential: (body: string, position: "for" | "against") => void;
  onClose: () => void;
  onCreated: (argument: ProposalRecord["arguments"][number]) => void;
}) {
  const saved = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("kuvend.pendingArgument.v1") ?? "null") as {
        body: string;
        position: "for" | "against";
      } | null;
    } catch {
      return null;
    }
  })();
  const [position, setPosition] = useState<"for" | "against">(saved?.position ?? "for");
  const [body, setBody] = useState(saved?.body ?? "");
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  async function submit() {
    if (!credential) return onNeedCredential(body, position);
    const holder = localStorage.getItem("kuvend.holderSecret.v1") ?? crypto.randomUUID();
    localStorage.setItem("kuvend.holderSecret.v1", holder);
    const contributionNullifier = await sha256(`${holder}:${proposal.id}:argument:${position}`);
    const response = await fetch(`${civicUrl}/v1/arguments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        proposalId: proposal.id,
        position,
        body,
        evidence,
        credential,
        contributionNullifier,
      }),
    });
    if (!response.ok) return setError("Argumenti nuk u dërgua. Mund të jetë dërguar më parë.");
    onCreated((await response.json()).argument);
  }
  return (
    <DialogShell
      title="Shto një argument"
      subtitle={`Ndihmo njerëzit ta peshojnë propozimin “${proposal.title}”. Pa replika dhe pa sulme personale.`}
      onClose={onClose}
    >
      <div className="position-tabs">
        <button className={position === "for" ? "selected" : ""} onClick={() => setPosition("for")}>
          <Check /> Pro
        </button>
        <button
          className={position === "against" ? "selected" : ""}
          onClick={() => setPosition("against")}
        >
          <X /> Kundër
        </button>
      </div>
      <label>
        Argumenti
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Shpjego një arsye të vetme, qartë dhe shkurt..."
          maxLength={700}
        />
      </label>
      <EvidenceEditor items={evidence} onChange={setEvidence} limit={3} />
      <p className="fineprint">Publikohet me një pseudonim të rastësishëm. Nuk krijohet profil.</p>
      <button className="primary full" onClick={() => void submit()}>
        Publiko argumentin
      </button>
      {error && <p className="error">{error}</p>}
    </DialogShell>
  );
}

function EvidenceEditor({
  items,
  onChange,
  limit,
}: {
  items: EvidenceItem[];
  onChange: (items: EvidenceItem[]) => void;
  limit: number;
}) {
  const [type, setType] = useState<EvidenceItem["type"]>("source");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const labels = { source: "Burim", document: "Dokument", image: "Imazh", video: "Video" };
  function add() {
    if (!title.trim() || !url.startsWith("https://") || items.length >= limit) return;
    onChange([...items, { type, title: title.trim(), url }]);
    setTitle("");
    setUrl("");
  }
  return (
    <fieldset className="evidence-editor">
      <legend>
        Prova dhe media <small>Opsionale</small>
      </legend>
      <p>
        Shto burime, dokumente, imazhe ose video si lidhje HTTPS. Media nuk ngarkohet ose hapet
        automatikisht.
      </p>
      <div className="evidence-fields">
        <select
          aria-label="Lloji i provës"
          value={type}
          onChange={(event) => setType(event.target.value as EvidenceItem["type"])}
        >
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          aria-label="Titulli i provës"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Titulli ose përshkrimi"
        />
        <input
          aria-label="Lidhja e provës"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…"
          inputMode="url"
        />
        <button type="button" className="secondary" onClick={add} disabled={items.length >= limit}>
          Shto
        </button>
      </div>
      <EvidenceList
        items={items}
        onRemove={(index) => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
      />
    </fieldset>
  );
}

function EvidenceList({
  items,
  onRemove,
}: {
  items: EvidenceItem[];
  onRemove?: (index: number) => void;
}) {
  return (
    <div className="evidence-list">
      {items.map((item, index) => (
        <div key={`${item.url}-${index}`}>
          <span>
            {item.type === "image"
              ? "Imazh"
              : item.type === "video"
                ? "Video"
                : item.type === "document"
                  ? "Dokument"
                  : "Burim"}
          </span>
          <a href={item.url} target="_blank" rel="noreferrer nofollow">
            {item.title}
          </a>
          {onRemove && (
            <button type="button" onClick={() => onRemove(index)} aria-label={`Hiq ${item.title}`}>
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
