"use client";

import {
  isPublicProposalStatus,
  type ArgumentRecord,
  type EvidenceItem,
  type ProposalRecord,
  type VoteChoice,
} from "@kuvend/contracts";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Checkbox,
  ChoiceButton,
  Dialog as ShadDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ExternalResearchActions,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  Input,
  Label,
  NativeSelect,
  Progress,
  ProgressLabel,
  ProgressValue,
  PublicSiteFooter,
  PublicSiteHeader,
  SearchField,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@kuvend/ui";
import {
  Archive,
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  CircleDot,
  CircleHelp,
  Clock3,
  List,
  LockKeyhole,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EvidenceEditor, EvidenceList } from "../features/kuvend/evidence";
import {
  buildGoogleSearchUrl,
  buildResearchDeepLink,
  buildResearchPrompt,
  openExternalResearchUrl,
  researchProviders,
  type ResearchProviderId,
} from "../features/kuvend/external-research";
import {
  defaultDisplayPreference,
  DisplayPreferenceEditor,
  displayPreferenceLabel,
  readDisplayPreference,
  saveDisplayPreference,
  type DisplayPreference,
} from "../features/kuvend/display-preference";
import { fallbackProposals } from "../features/kuvend/fallback-data";
import { extractProposalId, proposalPath } from "./proposal-url";

const civicUrl = process.env.NEXT_PUBLIC_CIVIC_API_URL ?? "";
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

export const fallback = fallbackProposals;

type Dialog =
  | "proposal"
  | "argument"
  | "argumentList"
  | "voteHelp"
  | "filters"
  | "notification"
  | "otp"
  | "receipt"
  | "recovery"
  | "manage"
  | null;
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

export function KuvendApp({
  initialSelectedId,
  initialProposal,
}: {
  initialSelectedId?: string;
  initialProposal?: ProposalRecord;
}) {
  const [proposals, setProposals] = useState<ProposalRecord[]>(() =>
    initialProposal
      ? [initialProposal, ...fallback.filter((proposal) => proposal.id !== initialProposal.id)]
      : fallback,
  );
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? "");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(false);
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
  const [displayNow, setDisplayNow] = useState<number | null>(null);
  const [mobileProposalToolsVisible, setMobileProposalToolsVisible] = useState(false);

  useEffect(() => {
    setDisplayNow(Date.now());
    setCredential(localStorage.getItem("kuvend.syntheticCredential.v1") ?? "");
    if (!civicUrl) return;
    fetch(`${civicUrl}/v1/proposals`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { proposals: ProposalRecord[] }) =>
        setProposals(data.proposals.filter((proposal) => isPublicProposalStatus(proposal.status))),
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (selectedId || !window.matchMedia("(max-width: 639px)").matches) {
      setMobileProposalToolsVisible(false);
      return;
    }

    const proposalArea = document.querySelector(".proposal-area");
    if (!proposalArea) return;
    const observer = new IntersectionObserver(
      ([entry]) => setMobileProposalToolsVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.02 },
    );
    observer.observe(proposalArea);
    return () => observer.disconnect();
  }, [selectedId]);

  useEffect(() => {
    const syncLocation = () => {
      const searchParams = new URLSearchParams(window.location.search);
      setQuery(searchParams.get("q") ?? "");
      setCategoryFilter(searchParams.get("category") ?? "");
      setStatusFilter(searchParams.get("status") ?? "");
      const proposalMatch = window.location.pathname.match(/^\/propozime\/([^/]+)$/);
      setSelectedId(proposalMatch?.[1] ? extractProposalId(proposalMatch[1]) : "");
      const action = searchParams.get("action");
      if (action === "proposal") setDialog("proposal");
      if (action === "notifications") setDialog("notification");
      if (action) {
        searchParams.delete("action");
        const queryString = searchParams.toString();
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`,
        );
      }
    };
    syncLocation();
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, []);

  const visible = useMemo(
    () =>
      proposals.filter(
        (proposal) =>
          `${proposal.title} ${proposal.summary}`
            .toLocaleLowerCase("sq-AL")
            .includes(query.toLocaleLowerCase("sq-AL")) &&
          (!categoryFilter || proposal.category === categoryFilter) &&
          (!statusFilter || proposal.status === statusFilter),
      ),
    [categoryFilter, proposals, query, statusFilter],
  );
  const selected =
    visible.find((proposal) => proposal.id === selectedId) ??
    visible[0] ??
    proposals.find((proposal) => proposal.id === selectedId) ??
    proposals[0]!;
  const voted = Boolean(result);

  useEffect(() => {
    setAuthorCapability(localStorage.getItem(`kuvend.capability.${selected.id}`) ?? "");
    setReceipt(localStorage.getItem(`kuvend.receipt.${selected.id}`) ?? "");
    setResult(null);
    setPendingVote(null);
    setHistoryExpanded(false);
  }, [selected.id]);

  const visibleHistory = historyExpanded
    ? selected.statusHistory
    : selected.statusHistory.slice(-4);
  const hiddenHistoryCount = selected.statusHistory.length - visibleHistory.length;
  const argumentsFor = selected.arguments.filter((argument) => argument.position === "for");
  const argumentsAgainst = selected.arguments.filter((argument) => argument.position === "against");

  function beginVote(choice: VoteChoice) {
    setPendingVote(choice);
    if (!credential) {
      setAfterOtp("vote");
      setDialog("otp");
    }
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    const url = new URL(window.location.href);
    if (nextQuery.trim()) url.searchParams.set("q", nextQuery);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function updateFilter(
    name: "category" | "status",
    value: string,
    updateState: (value: string) => void,
  ) {
    updateState(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function replacePath(pathname: string) {
    const url = new URL(window.location.href);
    url.pathname = pathname;
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function openProposal(pathname: string) {
    const url = new URL(window.location.href);
    url.pathname = pathname;
    window.history.pushState(
      { kuvendView: "proposal" },
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
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
    const url = `${location.origin}${proposalPath(selected)}`;
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

  function publicResearchProposal() {
    return {
      title: selected.title,
      problem: selected.problem,
      proposedChange: selected.proposedChange,
      scope: selected.scope === "national" ? "Kombëtar" : "Vendor",
      ...(selected.location ? { location: selected.location } : {}),
      category: categoryLabels[selected.category] ?? "Tjetër",
      evidence: selected.evidence.map(({ type, url, title, publisher, publishedAt }) => ({
        type,
        url,
        title,
        ...(publisher ? { publisher } : {}),
        ...(publishedAt ? { publishedAt } : {}),
      })),
      canonicalUrl: `${location.origin}${proposalPath(selected)}`,
    };
  }

  async function researchProposal(providerId: string) {
    const provider = researchProviders.find((item) => item.id === providerId);
    if (!provider?.enabled) {
      setNotice("Ky shërbim kërkimi nuk është i disponueshëm tani.");
      return;
    }

    const publicProposal = publicResearchProposal();
    if (provider.id === "google") {
      openExternalResearchUrl(buildGoogleSearchUrl(publicProposal));
      setNotice("Kërkimi u hap në Google.");
      return;
    }

    const prompt = buildResearchPrompt(publicProposal);
    try {
      await navigator.clipboard?.writeText(prompt);
    } catch {
      // The direct link already contains the public prompt; clipboard is only a fallback.
    }
    openExternalResearchUrl(
      buildResearchDeepLink(provider.id as "chatgpt" | "claude", publicProposal),
    );
    setNotice(`Pyetja u hap në ${provider.label.replace("Pyet ", "")}.`);
  }

  return (
    <div className={`site-shell ${selectedId ? "proposal-selected" : "proposal-index"}`}>
      <PublicSiteHeader
        active="proposals"
        onNotifications={() => setDialog("notification")}
        onPropose={() => setDialog("proposal")}
      />

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
              <a className="text-link" href="/si-funksionon">
                Si funksionon <ChevronRight size={18} />
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
              <a className="trust-link" href="/privatesia#si-mbrohet-vota">
                Si mbrohet privatësia <ChevronRight size={16} />
              </a>
            </div>
          </aside>
        </section>

        <section className="proposal-area" id="propozimet">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Ide, votime dhe rezultate</span>
              <div className="proposal-heading-line">
                <h2>Propozimet</h2>
                <span className="proposal-count" aria-label={`${visible.length} propozime`}>
                  {visible.length}
                </span>
              </div>
            </div>
            <div className="proposal-filters">
              <div className="proposal-filter-fields">
                <SearchField
                  value={query}
                  onChange={(event) => updateQuery(event.target.value)}
                  aria-label="Kërko propozime"
                  placeholder="Kërko propozime"
                />
                <NativeSelect
                  value={categoryFilter}
                  aria-label="Filtro sipas kategorisë"
                  onChange={(event) =>
                    updateFilter("category", event.target.value, setCategoryFilter)
                  }
                >
                  <option value="">Të gjitha kategoritë</option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  value={statusFilter}
                  aria-label="Filtro sipas statusit"
                  onChange={(event) => updateFilter("status", event.target.value, setStatusFilter)}
                >
                  <option value="">Çdo status</option>
                  <option value="voting_open">Votimi i hapur</option>
                  <option value="voting_closed">Votimi i mbyllur</option>
                  <option value="awaiting_response">Në pritje të përgjigjes</option>
                  <option value="responded">Me përgjigje</option>
                </NativeSelect>
              </div>
              <div className="status-shortcuts" role="group" aria-label="Statuset kryesore">
                <ChoiceButton
                  selected={statusFilter === ""}
                  onClick={() => updateFilter("status", "", setStatusFilter)}
                >
                  Të gjitha
                </ChoiceButton>
                <ChoiceButton
                  selected={statusFilter === "voting_open"}
                  onClick={() => updateFilter("status", "voting_open", setStatusFilter)}
                >
                  Hapur
                </ChoiceButton>
                <ChoiceButton
                  selected={statusFilter === "voting_closed"}
                  onClick={() => updateFilter("status", "voting_closed", setStatusFilter)}
                >
                  Mbyllur
                </ChoiceButton>
              </div>
            </div>
          </div>
          <div className="proposal-grid">
            <div className={`proposal-list ${selectedId ? "has-selection" : ""}`}>
              {visible.length === 0 && (
                <div className="proposal-empty" role="status">
                  Nuk u gjet asnjë propozim me këta filtra. Ndrysho kërkimin, kategorinë ose
                  statusin.
                </div>
              )}
              {visible.map((proposal) => (
                <Button
                  variant="ghost"
                  key={proposal.id}
                  className={`proposal-card ${proposal.id === selected.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedId(proposal.id);
                    openProposal(proposalPath(proposal));
                    setResult(null);
                    requestAnimationFrame(() =>
                      document.querySelector(".proposal-area")?.scrollIntoView({ block: "start" }),
                    );
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
                </Button>
              ))}
            </div>
            <article className="proposal-detail">
              <Button
                variant="ghost"
                className="mobile-back"
                onClick={() => {
                  if (window.history.state?.kuvendView === "proposal") window.history.back();
                  else {
                    setSelectedId("");
                    replacePath("/");
                  }
                  requestAnimationFrame(() =>
                    document.querySelector(".proposal-area")?.scrollIntoView({ block: "start" }),
                  );
                }}
              >
                <ArrowLeft size={17} /> Të gjitha propozimet
              </Button>
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
              <aside className="research-callout">
                <span className="research-callout-icon" aria-hidden="true">
                  <Search />
                </span>
                <div>
                  <strong>Kontrollo pretendimet para se të votosh</strong>
                  <p>Hulumto burimet dhe kundërargumentet me AI ose Google.</p>
                </div>
                <div className="research-callout-action">
                  <ExternalResearchActions
                    actions={researchProviders.map((provider) => ({
                      id: provider.id,
                      label: provider.label,
                      description: provider.description,
                      icon: provider.icon,
                      disabled: !provider.enabled,
                    }))}
                    onSelect={(providerId) =>
                      void researchProposal(providerId as ResearchProviderId)
                    }
                  />
                </div>
              </aside>
              <div className="proposal-detail-columns">
                <div className="proposal-content">
                  <section>
                    <h3>Problemi</h3>
                    <p>{selected.problem}</p>
                  </section>
                  <section>
                    <h3>Ndryshimi i propozuar</h3>
                    <p>{selected.proposedChange}</p>
                  </section>
                  {selected.evidence.length > 0 && (
                    <section>
                      <h3>Prova dhe media</h3>
                      <EvidenceList items={selected.evidence} />
                    </section>
                  )}
                </div>
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
                            : "Shiko historikun më poshtë për arsyen dhe hapat e ardhshëm."}
                        </p>
                        {selected.status === "duplicate" && selected.duplicateOf && (
                          <a href={`/propozime/${selected.duplicateOf}`}>
                            Shiko propozimin kryesor
                          </a>
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
                        <Button
                          variant="outline"
                          className={pendingVote === "support" ? "support active" : "support"}
                          onClick={() => beginVote("support")}
                        >
                          <Check /> Mbështes
                        </Button>
                        <Button
                          variant="outline"
                          className={pendingVote === "oppose" ? "oppose active" : "oppose"}
                          onClick={() => beginVote("oppose")}
                        >
                          <X /> Kundërshtoj
                        </Button>
                      </div>
                      {pendingVote && credential && (
                        <div className="vote-confirmation">
                          <div>
                            <ShieldCheck />
                            <p>
                              <strong>Gati për konfirmim</strong>
                              Numri yt nuk dërgohet me votën. Rezultati shfaqet vetëm pasi ta
                              konfirmosh.
                            </p>
                          </div>
                          <Button className="confirm" onClick={() => void castVote()}>
                            Konfirmo votën përfundimtare
                          </Button>
                        </div>
                      )}
                      <p className="fineprint">
                        <LockKeyhole size={13} />
                        <span>Votë përfundimtare, këshilluese.</span>
                        <Button variant="link" onClick={() => setDialog("voteHelp")}>
                          Hapat
                        </Button>
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
              </div>
              <div className="proposal-followup">
                <section className="arguments-section" aria-labelledby="arguments-title">
                  <div className="arguments-heading">
                    <div>
                      <h3 id="arguments-title">Argumentet</h3>
                      <Badge variant="secondary">{selected.arguments.length}</Badge>
                    </div>
                    <Button variant="outline" onClick={() => setDialog("argument")}>
                      <MessageSquareText /> Shto argument
                    </Button>
                  </div>
                  <div className="argument-preview-grid">
                    <div className="argument-column">
                      <div className="argument-column-heading for">
                        <span>
                          <Check size={16} /> Pro
                        </span>
                        <strong>{argumentsFor.length}</strong>
                      </div>
                      {argumentsFor.length > 0 ? (
                        <ArgumentCard argument={argumentsFor.at(-1)!} />
                      ) : (
                        <p className="argument-empty">Ende nuk ka argumente pro.</p>
                      )}
                    </div>
                    <div className="argument-column">
                      <div className="argument-column-heading against">
                        <span>
                          <X size={16} /> Kundër
                        </span>
                        <strong>{argumentsAgainst.length}</strong>
                      </div>
                      {argumentsAgainst.length > 0 ? (
                        <ArgumentCard argument={argumentsAgainst.at(-1)!} />
                      ) : (
                        <p className="argument-empty">Ende nuk ka argumente kundër.</p>
                      )}
                    </div>
                  </div>
                  {selected.arguments.length > 2 && (
                    <Button
                      variant="ghost"
                      className="view-all-arguments"
                      onClick={() => setDialog("argumentList")}
                    >
                      Shiko të gjitha {selected.arguments.length} argumentet
                      <ChevronRight />
                    </Button>
                  )}
                </section>
                <section className="history-section">
                  <h3>Historiku</h3>
                  <ol className="status-timeline">
                    {visibleHistory.map((event, index) => (
                      <li key={`${event.at}-${index}`}>
                        <strong>{statusLabel(event.status)}</strong>
                        <span>{formatDate(event.at)}</span>
                        {event.note && <p>{event.note}</p>}
                      </li>
                    ))}
                  </ol>
                  {selected.statusHistory.length > 4 && (
                    <Button
                      variant="ghost"
                      className="history-toggle"
                      aria-expanded={historyExpanded}
                      onClick={() => setHistoryExpanded((expanded) => !expanded)}
                    >
                      {historyExpanded
                        ? "Shfaq vetëm ngjarjet e fundit"
                        : `Shfaq edhe ${hiddenHistoryCount} ngjarje`}
                    </Button>
                  )}
                </section>
                {selected.institutionalResponse && (
                  <section className="institutional-response">
                    <h3>Përgjigjja institucionale</h3>
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
              </div>
            </article>
          </div>
          {mobileProposalToolsVisible && (
            <div className="mobile-filter-bar" role="group" aria-label="Statuset kryesore">
              <Button
                variant="ghost"
                className={`mobile-filter-action ${statusFilter === "" ? "active" : ""}`}
                aria-pressed={statusFilter === ""}
                onClick={() => updateFilter("status", "", setStatusFilter)}
              >
                <List aria-hidden="true" />
                <span>Të gjitha</span>
              </Button>
              <Button
                variant="ghost"
                className={`mobile-filter-action ${statusFilter === "voting_open" ? "active" : ""}`}
                aria-pressed={statusFilter === "voting_open"}
                onClick={() => updateFilter("status", "voting_open", setStatusFilter)}
              >
                <CircleDot aria-hidden="true" />
                <span>Në votim</span>
              </Button>
              <Button
                variant="ghost"
                className={`mobile-filter-action ${statusFilter === "voting_closed" ? "active" : ""}`}
                aria-pressed={statusFilter === "voting_closed"}
                onClick={() => updateFilter("status", "voting_closed", setStatusFilter)}
              >
                <Archive aria-hidden="true" />
                <span>Mbyllur</span>
              </Button>
              <Button
                variant="ghost"
                className="mobile-filter-action"
                aria-label="Më shumë filtra"
                onClick={() => setDialog("filters")}
              >
                <span className="mobile-filter-icon">
                  <SlidersHorizontal aria-hidden="true" />
                  {(query ||
                    categoryFilter ||
                    !["", "voting_open", "voting_closed"].includes(statusFilter)) && (
                    <i aria-hidden="true" />
                  )}
                </span>
                <span>Filtra</span>
              </Button>
            </div>
          )}
        </section>

        <section className="how" id="si-funksionon">
          <span className="eyebrow">E thjeshtë dhe e shpjegueshme</span>
          <div className="how-heading">
            <h2>Nga ideja te përgjigjja</h2>
            <a className="text-link" href="/si-funksionon">
              Shiko shpjegimin e plotë <ChevronRight />
            </a>
          </div>
          <div className="steps">
            <div>
              <div className="step-marker">
                <b>1</b>
                <Plus aria-hidden="true" />
              </div>
              <h3>Propozo</h3>
              <p>Shkruaj ose dikto idenë. Ndihma gjuhësore është gjithmonë opsionale.</p>
            </div>
            <div>
              <div className="step-marker">
                <b>2</b>
                <ShieldCheck aria-hidden="true" />
              </div>
              <h3>Shqyrtohet</h3>
              <p>Brenda 72 orësh kontrollohen siguria, privatësia dhe dublikatat.</p>
            </div>
            <div>
              <div className="step-marker">
                <b>3</b>
                <Check aria-hidden="true" />
              </div>
              <h3>Votohet</h3>
              <p>Çdo propozim i pranueshëm qëndron hapur 14 ditë dhe dy fundjava.</p>
            </div>
            <div>
              <div className="step-marker">
                <b>4</b>
                <Send aria-hidden="true" />
              </div>
              <h3>Ndiqet</h3>
              <p>Rezultati i dërgohet institucionit dhe përgjigjja publikohet.</p>
            </div>
          </div>
        </section>
      </main>

      <PublicSiteFooter />

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
          onNeedCredential={(body, position, evidence, publicAuthorName) => {
            sessionStorage.setItem(
              "kuvend.pendingArgument.v1",
              JSON.stringify({ body, position, evidence, publicAuthorName }),
            );
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
      {dialog === "argumentList" && (
        <ArgumentListDialog arguments={selected.arguments} onClose={() => setDialog(null)} />
      )}
      {dialog === "voteHelp" && <VoteHelpDialog onClose={() => setDialog(null)} />}
      {dialog === "filters" && (
        <DialogShell
          title="Kërko dhe filtro"
          subtitle="Gjej propozime sipas fjalëve, kategorisë ose fazës së tyre."
          onClose={() => setDialog(null)}
        >
          <div className="mobile-filter-sheet">
            <Field>
              <Label htmlFor="mobile-proposal-search">Kërko propozime</Label>
              <SearchField
                id="mobile-proposal-search"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Shkruaj një fjalë kyçe"
              />
            </Field>
            <Field>
              <Label htmlFor="mobile-category-filter">Kategoria</Label>
              <NativeSelect
                id="mobile-category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  updateFilter("category", event.target.value, setCategoryFilter)
                }
              >
                <option value="">Të gjitha kategoritë</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <Label htmlFor="mobile-status-filter">Statusi</Label>
              <NativeSelect
                id="mobile-status-filter"
                value={statusFilter}
                onChange={(event) => updateFilter("status", event.target.value, setStatusFilter)}
              >
                <option value="">Çdo status</option>
                <option value="voting_open">Votimi i hapur</option>
                <option value="voting_closed">Votimi i mbyllur</option>
                <option value="awaiting_response">Në pritje të përgjigjes</option>
                <option value="responded">Me përgjigje</option>
              </NativeSelect>
            </Field>
            <div className="mobile-filter-sheet-actions">
              <Button
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setCategoryFilter("");
                  setStatusFilter("");
                  window.history.replaceState(null, "", "/#propozimet");
                }}
              >
                Pastro filtrat
              </Button>
              <Button onClick={() => setDialog(null)}>Shfaq {visible.length} rezultate</Button>
            </div>
          </div>
        </DialogShell>
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
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
        <div>
          <strong>Kufiri i privatësisë</strong>
          <p>
            Shërbimi i propozimeve dhe votimit nuk e merr numrin. Në këtë beta, shërbimi i izoluar i
            Kuvend dhe ofruesi SMS do ta përpunonin përkohësisht.
          </p>
          <ul className="trust-checks">
            <li>OTP provon vetëm kontrollin e numrit.</li>
            <li>Dëshmia zgjat 30 ditë dhe përdoret pa profil qytetar.</li>
            <li>Mund të lexosh dhe të mbyllësh dritaren pa vazhduar.</li>
          </ul>
          <a className="trust-inline-link" href="/privatesia#si-mbrohet-vota">
            Lexo shpjegimin e plotë
          </a>
        </div>
      </div>
      {!challenge ? (
        <>
          <Field>
            <Label htmlFor="otp-phone">Numri i telefonit</Label>
            <Input
              id="otp-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              autoFocus
            />
          </Field>
          <Button className="full" onClick={() => void start()}>
            Dërgo kodin
          </Button>
        </>
      ) : (
        <>
          <Field>
            <Label htmlFor="otp-code">Kodi gjashtëshifror</Label>
            <Input
              id="otp-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              maxLength={6}
              autoFocus
              placeholder="123456"
            />
          </Field>
          {otpProvider === "synthetic" && (
            <p className="dev-note">
              Beta sintetike: përdor kodin <strong>123456</strong>.
            </p>
          )}
          <Button className="full" onClick={() => void check()}>
            Verifiko dhe vazhdo
          </Button>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </DialogShell>
  );
}

function ArgumentCard({ argument }: { argument: ArgumentRecord }) {
  return (
    <blockquote className={`argument-card ${argument.position}`}>
      <span>{argument.position === "for" ? "Pro" : "Kundër"}</span>
      <p>{argument.body}</p>
      <cite>{argument.publicAuthorName ?? argument.pseudonym}</cite>
      {argument.evidence.length > 0 && <EvidenceList items={argument.evidence} />}
    </blockquote>
  );
}

function ArgumentListDialog({
  arguments: proposalArguments,
  onClose,
}: {
  arguments: ArgumentRecord[];
  onClose: () => void;
}) {
  const argumentsFor = proposalArguments.filter((argument) => argument.position === "for");
  const argumentsAgainst = proposalArguments.filter((argument) => argument.position === "against");

  return (
    <DialogShell
      title="Të gjitha argumentet"
      subtitle="Lexoji të dyja anët para se të marrësh një vendim. Argumentet renditen nga më të rejat."
      onClose={onClose}
    >
      <div className="argument-dialog-columns">
        <section aria-labelledby="all-arguments-for">
          <div className="argument-column-heading for">
            <span id="all-arguments-for">
              <Check size={16} /> Pro
            </span>
            <strong>{argumentsFor.length}</strong>
          </div>
          <div className="argument-dialog-list">
            {[...argumentsFor].reverse().map((argument) => (
              <ArgumentCard key={argument.id} argument={argument} />
            ))}
          </div>
        </section>
        <section aria-labelledby="all-arguments-against">
          <div className="argument-column-heading against">
            <span id="all-arguments-against">
              <X size={16} /> Kundër
            </span>
            <strong>{argumentsAgainst.length}</strong>
          </div>
          <div className="argument-dialog-list">
            {[...argumentsAgainst].reverse().map((argument) => (
              <ArgumentCard key={argument.id} argument={argument} />
            ))}
          </div>
        </section>
      </div>
    </DialogShell>
  );
}

function VoteHelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <DialogShell
      title="Si funksionon vota"
      subtitle="Këto hapa ndodhin pa u larguar nga propozimi."
      onClose={onClose}
    >
      <ol className="vote-help-steps">
        <li>
          <span>1</span>
          <div>
            <strong>Shikon pjesëmarrjen</strong>
            <p>Para votës shfaqet vetëm numri i pjesëmarrësve, jo ndarja e rezultatit.</p>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Zgjedh një anë</strong>
            <p>
              Zgjidh “Mbështes” ose “Kundërshtoj”. Mund ta kontrollosh zgjedhjen para konfirmimit.
            </p>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>Verifikohesh kur duhet</strong>
            <p>
              Telefoni përdoret nga shërbimi i izoluar. Numri nuk i dërgohet shërbimit të votimit.
            </p>
          </div>
        </li>
        <li>
          <span>4</span>
          <div>
            <strong>Konfirmon votën përfundimtare</strong>
            <p>Pranohet vetëm një votë për këtë propozim. Pas konfirmimit shikon rezultatin.</p>
          </div>
        </li>
        <li>
          <span>5</span>
          <div>
            <strong>Merr mandatin</strong>
            <p>Mandati mbahet nga ti dhe të ndihmon të kontrollosh përfshirjen pas mbylljes.</p>
          </div>
        </li>
      </ol>
      <div className="dialog-actions">
        <Button onClick={onClose}>E kuptova</Button>
      </div>
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
  const [displayPreference, setDisplayPreference] = useState<DisplayPreference>(() =>
    readDisplayPreference(),
  );
  function updateDisplayPreference(value: DisplayPreference) {
    setDisplayPreference(value);
    saveDisplayPreference(value);
  }
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
      body: JSON.stringify({
        ...draft,
        scope: "national",
        credential,
        authorCapabilityHash,
        ...(displayPreference.mode === "name" && displayPreference.name.trim()
          ? { publicAuthorName: displayPreference.name.trim() }
          : {}),
      }),
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
              <FieldDescription>Zgjidh temën që e përshkruan më mirë propozimin.</FieldDescription>
            </Field>
            <EvidenceEditor
              items={draft.evidence}
              onChange={(items) => field("evidence", items)}
              limit={8}
            />
            <DisplayPreferenceEditor value={displayPreference} onChange={updateDisplayPreference} />
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
              <div>
                <span>Publikohet si</span>
                <strong>{displayPreferenceLabel(displayPreference)}</strong>
              </div>
            </div>
            <label className="confirm-check">
              <Checkbox
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
          <>
            <Button variant="outline" onClick={() => setStep(6)}>
              Pa ndihmë AI
            </Button>
            <Button onClick={() => void improve()}>
              Kontrollo me AI <ChevronRight data-icon="inline-end" />
            </Button>
          </>
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
      <div className="receipt-trust">
        <ShieldCheck />
        <p>
          Mandati kontrollon përfshirjen. Ai nuk përmban numrin tënd dhe nuk duhet publikuar si
          provë e zgjedhjes sate.
        </p>
      </div>
      <div className="dialog-actions">
        <Button variant="outline" onClick={download}>
          Shkarko
        </Button>
        <Button onClick={() => void verify()}>Verifiko përfshirjen</Button>
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
        <Button variant="outline" onClick={() => void navigator.clipboard.writeText(secret)}>
          Kopjo
        </Button>
        <Button onClick={download}>Shkarko dhe vazhdo</Button>
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
          <ChoiceButton selected={action === "revise"} onClick={() => setAction("revise")}>
            Ndrysho
          </ChoiceButton>
        )}
        {canWithdraw && (
          <ChoiceButton selected={action === "withdraw"} onClick={() => setAction("withdraw")}>
            Tërhiqe
          </ChoiceButton>
        )}
        {canAppeal && (
          <ChoiceButton selected={action === "appeal"} onClick={() => setAction("appeal")}>
            Apelo
          </ChoiceButton>
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
            <NativeSelect
              id="manage-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as ProposalRecord["category"])}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
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
      <fieldset className="notification-topics" aria-describedby="notification-topics-help">
        <FieldLegend>Temat që dëshiron</FieldLegend>
        <FieldDescription id="notification-topics-help">
          Lëri të gjitha bosh për çdo votim të ri.
        </FieldDescription>
        <div>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <label key={value}>
              <Checkbox
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
      <Button className="full" disabled={state === "working"} onClick={() => void subscribe()}>
        {state === "working"
          ? "Duke ruajtur…"
          : state === "done"
            ? "Ruaj temat"
            : "Aktivizo njoftimet"}
      </Button>
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
  onNeedCredential: (
    body: string,
    position: "for" | "against",
    evidence: EvidenceItem[],
    publicAuthorName?: string,
  ) => void;
  onClose: () => void;
  onCreated: (argument: ProposalRecord["arguments"][number]) => void;
}) {
  const saved = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("kuvend.pendingArgument.v1") ?? "null") as {
        body: string;
        position: "for" | "against";
        evidence: EvidenceItem[];
        publicAuthorName?: string;
      } | null;
    } catch {
      return null;
    }
  })();
  const [position, setPosition] = useState<"for" | "against">(saved?.position ?? "for");
  const [body, setBody] = useState(saved?.body ?? "");
  const [displayPreference, setDisplayPreference] = useState<DisplayPreference>(() =>
    saved?.publicAuthorName
      ? { mode: "name", name: saved.publicAuthorName }
      : (readDisplayPreference() ?? defaultDisplayPreference),
  );
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>(saved?.evidence ?? []);
  async function submit() {
    const visibleName =
      displayPreference.mode === "name" ? displayPreference.name.trim() : undefined;
    if (!credential) return onNeedCredential(body, position, evidence, visibleName);
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
        ...(visibleName ? { publicAuthorName: visibleName } : {}),
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
        <ChoiceButton
          tone="success"
          selected={position === "for"}
          onClick={() => setPosition("for")}
        >
          <Check /> Pro
        </ChoiceButton>
        <ChoiceButton
          tone="danger"
          selected={position === "against"}
          onClick={() => setPosition("against")}
        >
          <X /> Kundër
        </ChoiceButton>
      </div>
      <Field>
        <Label htmlFor="argument-body">Argumenti</Label>
        <Textarea
          id="argument-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Shpjego një arsye të vetme, qartë dhe shkurt..."
          maxLength={700}
        />
      </Field>
      <EvidenceEditor items={evidence} onChange={setEvidence} limit={3} />
      <div className="author-default">
        <div>
          <span>Po publikon si</span>
          <strong>{displayPreferenceLabel(displayPreference)}</strong>
        </div>
        <Button type="button" variant="ghost" onClick={() => setEditingIdentity((value) => !value)}>
          {editingIdentity ? "Mbyll" : "Ndrysho"}
        </Button>
      </div>
      {editingIdentity && (
        <DisplayPreferenceEditor
          value={displayPreference}
          onChange={(value) => {
            setDisplayPreference(value);
            saveDisplayPreference(value);
          }}
        />
      )}
      <Button
        className="full"
        disabled={
          body.trim().length < 8 ||
          (displayPreference.mode === "name" && displayPreference.name.trim().length < 2)
        }
        onClick={() => void submit()}
      >
        Publiko argumentin
      </Button>
      {error && <p className="error">{error}</p>}
    </DialogShell>
  );
}
