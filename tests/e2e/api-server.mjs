import { createServer } from "node:http";

const proposals = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Më shumë hije në stacionet e autobusëve",
    summary: "Stacionet pa hije i ekspozojnë udhëtarët ndaj vapës së verës.",
    problem: "Shumë stacione autobusi nuk kanë strehë ose hije për udhëtarët.",
    proposedChange: "Bashkitë të vendosin strehë, hije dhe ulëse në stacionet më të përdorura.",
    scope: "national",
    category: "transport",
    evidence: [],
    pseudonym: "Lisi i Qetë",
    status: "voting_open",
    revisionNumber: 1,
    votingRound: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      opensAt: "2026-08-01T09:00:00.000Z",
      closesAt: "2026-08-15T09:00:00.000Z",
      turnout: 428,
    },
    arguments: [],
    statusHistory: [
      { status: "pending_review", at: "2026-07-30T09:00:00.000Z", note: "U dorëzua." },
      { status: "voting_open", at: "2026-08-01T09:00:00.000Z", note: "Kaloi moderimin." },
    ],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Kontratat publike në format të hapur",
    summary: "Kontratat duhet të jenë të kërkueshme dhe të ripërdorshme.",
    problem: "Dokumentet publike nuk kërkohen lehtë.",
    proposedChange: "Kontratat të publikohen si të dhëna të strukturuara.",
    scope: "national",
    category: "governance",
    evidence: [],
    pseudonym: "Fjala e Lirë",
    status: "voting_closed",
    revisionNumber: 1,
    votingRound: {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      opensAt: "2026-07-01T09:00:00.000Z",
      closesAt: "2026-07-15T09:00:00.000Z",
      turnout: 312,
    },
    closedResult: { turnout: 312, support: 240, oppose: 72, closedAt: "2026-07-15T09:00:00.000Z" },
    arguments: [],
    statusHistory: [
      { status: "voting_closed", at: "2026-07-15T09:00:00.000Z", note: "Votimi u mbyll." },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Kalime më të sigurta pranë shkollave",
    summary: "Sinjalistikë dhe ndriçim më i mirë në zonat me fëmijë.",
    problem: "Hyrjet e shkollave nuk kanë kalime të dukshme.",
    proposedChange: "Auditim sigurie dhe ndërhyrje pranë çdo shkolle.",
    scope: "national",
    category: "community",
    evidence: [],
    pseudonym: "Drita e Mëngjesit",
    status: "voting_open",
    revisionNumber: 1,
    votingRound: {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      opensAt: "2026-08-01T09:00:00.000Z",
      closesAt: "2026-08-15T09:00:00.000Z",
      turnout: 187,
    },
    arguments: [],
    statusHistory: [
      { status: "voting_open", at: "2026-08-01T09:00:00.000Z", note: "Kaloi moderimin." },
    ],
  },
];

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "content-type": "application/json; charset=utf-8",
};

createServer((request, response) => {
  if (request.method === "OPTIONS") return void response.writeHead(204, headers).end();
  const url = new URL(request.url ?? "/", "http://localhost:4000");
  if (request.method === "GET" && url.pathname === "/v1/proposals") {
    response.writeHead(200, headers).end(JSON.stringify({ proposals }));
    return;
  }
  const proposalId = url.pathname.match(/^\/v1\/proposals\/([^/]+)$/)?.[1];
  if (request.method === "GET" && proposalId) {
    const proposal = proposals.find((item) => item.id === proposalId);
    response
      .writeHead(proposal ? 200 : 404, headers)
      .end(JSON.stringify(proposal ? { proposal } : { error: "proposal_not_found" }));
    return;
  }
  response.writeHead(404, headers).end(JSON.stringify({ error: "not_found" }));
}).listen(4000, "127.0.0.1");
