import type { ProposalRecord } from "@kuvend/contracts";

const now = new Date();
const closesAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1_000).toISOString();

export const seedProposals: ProposalRecord[] = [
  {
    id: "0f6d9f4b-18a4-4bc0-9e5f-0f7df42a17bb",
    title: "Transport publik më i shpeshtë në orët e pikut",
    summary: "Rritja e frekuencave të urbanëve për të zvogëluar pritjet dhe mbipopullimin.",
    problem:
      "Në orët e pikut, urbanët janë të mbingarkuar dhe vonesat janë të shpeshta. Qytetarët presin gjatë dhe udhëtimi bëhet i lodhshëm.",
    proposedChange:
      "Të rritet frekuenca e linjave kryesore nga ora 07:00–09:00 dhe 16:00–19:00, me publikim mujor të kohës mesatare të pritjes.",
    scope: "local",
    location: "Tiranë",
    category: "transport",
    evidence: [],
    pseudonym: "Zëri i Blertë",
    status: "voting_open",
    revisionNumber: 1,
    votingRound: {
      id: "4fa09f7d-f1c6-4983-a642-2892f4940ce5",
      opensAt: now.toISOString(),
      closesAt,
      turnout: 128,
    },
    arguments: [
      {
        id: "5ed0d5a4-ae67-4e26-b1b2-d2b2a8c451ad",
        position: "for",
        body: "Udhëtime më të shpejta dhe më të parashikueshme për punëtorët dhe studentët.",
        evidence: [],
        pseudonym: "Lisi i Qetë",
        createdAt: now.toISOString(),
      },
      {
        id: "84fed142-eeb4-435d-8acc-2b59b704547e",
        position: "against",
        body: "Kostoja duhet të shoqërohet me një plan të qartë financimi dhe matje të përdorimit.",
        evidence: [],
        pseudonym: "Ura e Hapur",
        createdAt: now.toISOString(),
      },
    ],
    statusHistory: [
      { status: "pending_review", at: now.toISOString(), note: "U dorëzua për shqyrtim." },
      { status: "voting_open", at: now.toISOString(), note: "Votimi këshillues është hapur." },
    ],
  },
  {
    id: "c65f4e37-1803-4f09-9d4d-b932b4e0e54e",
    title: "Mbjellja e pemëve në lagjet urbane",
    summary: "Program vjetor për më shumë gjelbërim dhe ajër më të pastër.",
    problem: "Shumë lagje të dendura kanë pak hije dhe pak hapësira të gjelbra publike.",
    proposedChange:
      "Të publikohet një plan vjetor mbjelljeje me harta, llojet e pemëve dhe raport mbijetese pas çdo sezoni.",
    scope: "national",
    category: "environment",
    evidence: [],
    pseudonym: "Drita e Mëngjesit",
    status: "voting_open",
    revisionNumber: 1,
    votingRound: {
      id: "ae1e0eab-a4e4-4037-a588-23f3215ef822",
      opensAt: now.toISOString(),
      closesAt,
      turnout: 94,
    },
    arguments: [],
    statusHistory: [
      { status: "voting_open", at: now.toISOString(), note: "Votimi këshillues është hapur." },
    ],
  },
  {
    id: "188ce1ee-d8f4-4322-a6be-4f9e961c8ad8",
    title: "Transparencë për kontratat publike lokale",
    summary: "Publikimi i kontratave, pagesave dhe ecurisë në një format të kërkueshëm.",
    problem:
      "Informacioni për zbatimin e kontratave lokale është i shpërndarë dhe i vështirë për t'u ndjekur.",
    proposedChange:
      "Çdo bashki të publikojë kontratën, afatet, pagesat dhe statusin e zbatimit në të njëjtin format të hapur.",
    scope: "national",
    category: "governance",
    evidence: [],
    pseudonym: "Guri i Bardhë",
    status: "voting_open",
    revisionNumber: 1,
    votingRound: {
      id: "23e9ce97-8743-4d0b-97c0-b9ade2bc3ca2",
      opensAt: now.toISOString(),
      closesAt,
      turnout: 76,
    },
    arguments: [],
    statusHistory: [
      { status: "voting_open", at: now.toISOString(), note: "Votimi këshillues është hapur." },
    ],
  },
];
