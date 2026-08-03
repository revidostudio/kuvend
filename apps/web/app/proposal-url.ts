type ProposalLinkSource = { id: string; title: string };

const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

export function proposalSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("sq-AL")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function proposalSegment(proposal: ProposalLinkSource) {
  const slug = proposalSlug(proposal.title) || "propozim";
  return `${slug}--${proposal.id}`;
}

export function proposalPath(proposal: ProposalLinkSource) {
  return `/propozime/${proposalSegment(proposal)}`;
}

export function extractProposalId(segment: string) {
  return segment.match(uuidPattern)?.[0] ?? segment;
}
