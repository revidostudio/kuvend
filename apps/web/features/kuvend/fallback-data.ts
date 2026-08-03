import type { ProposalRecord } from "@kuvend/contracts";

export const fallbackProposals: ProposalRecord[] = [
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
      {
        id: "a3",
        position: "for",
        body: "Hija dhe ulëset do ta bënin pritjen më të sigurt për të moshuarit dhe fëmijët.",
        evidence: [],
        pseudonym: "Bredhi i Gjelbër",
        createdAt: "2026-07-27T10:00:00.000Z",
      },
      {
        id: "a4",
        position: "against",
        body: "Duhet publikuar një kosto e përafërt për çdo stacion para se të merret vendimi.",
        evidence: [],
        pseudonym: "Mali i Hapur",
        createdAt: "2026-07-28T10:00:00.000Z",
      },
    ],
    statusHistory: [
      {
        status: "pending_review",
        at: "2026-07-18T09:00:00.000Z",
        note: "Propozimi u dorëzua për shqyrtim.",
      },
      {
        status: "needs_changes",
        at: "2026-07-19T09:00:00.000Z",
        note: "U kërkua të qartësohej institucioni përgjegjës.",
      },
      {
        status: "pending_review",
        at: "2026-07-20T09:00:00.000Z",
        note: "Autori dorëzoi versionin e përmirësuar.",
      },
      {
        status: "pending_review",
        at: "2026-07-21T09:00:00.000Z",
        note: "Kontrolli i privatësisë u përfundua.",
      },
      {
        status: "pending_review",
        at: "2026-07-22T09:00:00.000Z",
        note: "Dy moderatorë konfirmuan vendimin.",
      },
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
    status: "voting_closed",
    revisionNumber: 1,
    votingRound: {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      opensAt: "2026-07-14T09:00:00.000Z",
      closesAt: "2026-07-28T09:00:00.000Z",
      turnout: 312,
    },
    closedResult: {
      turnout: 312,
      support: 240,
      oppose: 72,
      closedAt: "2026-07-28T09:00:00.000Z",
    },
    arguments: [],
    statusHistory: [
      {
        status: "voting_open",
        at: "2026-07-14T09:00:00.000Z",
        note: "Kaloi kontrollin e moderimit.",
      },
      {
        status: "voting_closed",
        at: "2026-07-28T09:00:00.000Z",
        note: "Votimi u mbyll pas 14 ditësh.",
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
