import Fastify from "fastify";
import { z } from "zod";
import { MemoryAdminAuditStore, type AdminAuditStore } from "./audit-store.js";

const moderationSchema = z
  .object({
    status: z.enum(["needs_changes", "duplicate", "rejected", "voting_open"]),
    note: z.string().trim().min(4).max(2_000),
    duplicateOf: z.string().uuid().optional(),
  })
  .strict();

const responseSchema = z
  .object({
    institution: z.string().trim().min(2).max(180),
    status: z.enum(["awaiting_response", "responded", "no_response"]),
    responseText: z.string().trim().max(5_000).optional(),
    sourceUrl: z.string().url().startsWith("https://").optional(),
    note: z.string().trim().min(4).max(1_000),
  })
  .strict();

const dashboard = `<!doctype html><html lang="sq"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kuvend · Moderimi</title><style>:root{font-family:Inter,system-ui,sans-serif;color:#172033;background:#f1f5f9}*{box-sizing:border-box}body{margin:0}header{background:#071a36;color:white;padding:1.2rem max(1rem,calc((100% - 1100px)/2));display:flex;align-items:center;gap:1rem}header strong{font-size:1.35rem}main{max-width:1100px;margin:2rem auto;padding:0 1rem}.notice,.panel{background:white;border:1px solid #dce3eb;border-radius:16px;padding:1.25rem;margin-bottom:1rem}.notice{border-left:4px solid #d71920}label{display:grid;gap:.35rem;font-size:.8rem;font-weight:700}input,select,textarea,button{font:inherit;border:1px solid #cbd5e1;border-radius:9px;padding:.7rem}button{background:#d71920;color:white;border:0;font-weight:750;cursor:pointer}.auth{display:grid;grid-template-columns:1fr 1fr auto;gap:.75rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:1rem}.case{background:white;border-radius:14px;padding:1rem;border:1px solid #dce3eb}.case h3{margin:.25rem 0}.muted{color:#64748b;font-size:.85rem}.actions{display:grid;gap:.6rem;margin-top:1rem}textarea{min-height:90px}@media(max-width:650px){.auth{grid-template-columns:1fr}}</style></head><body><header><strong>Kuvend · Moderimi</strong><span>origjinë dhe bazë e ndarë</span></header><main><section class="notice"><strong>Beta sintetike.</strong> Prodhimi kërkon passkeys/MFA dhe miratim nga dy persona. Ky panel nuk merr numra telefoni apo dëshmi qytetare.</section><section class="panel auth"><label>Çelësi lokal<input id="token" type="password" autocomplete="off"></label><label>Emri i moderatorit<input id="actor" value="moderatori-lokal"></label><button id="load">Ngarko radhën</button></section><div id="status" class="muted"></div><section id="cases" class="grid"></section><section class="panel"><h2>Gjurmimi i institucionit</h2><div class="actions"><input id="response-id" placeholder="ID e propozimit"><input id="response-institution" placeholder="Institucioni"><select id="response-status"><option value="awaiting_response">Në pritje</option><option value="responded">U përgjigj</option><option value="no_response">Pa përgjigje</option></select><textarea id="response-text" placeholder="Teksti i përgjigjes (opsional)"></textarea><input id="response-url" placeholder="https://burimi-zyrtar…"><textarea id="response-note" placeholder="Shënimi publik"></textarea><button id="record-response">Regjistro gjendjen</button></div></section></main><script>const q=(s)=>document.querySelector(s);const esc=(v)=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');const headers=()=>({'authorization':'Bearer '+q('#token').value,'x-admin-actor':q('#actor').value,'content-type':'application/json'});q('#load').onclick=async()=>{const r=await fetch('/v1/moderation-cases',{headers:headers()});if(!r.ok){q('#status').textContent='Autorizimi dështoi.';return}const data=await r.json();q('#status').textContent=data.cases.length+' raste';q('#cases').innerHTML=data.cases.map(c=>'<article class="case"><span class="muted">'+esc(c.kind)+' · '+esc(c.status)+'</span><h3>'+esc(c.proposalId)+'</h3><p>'+esc(c.reason)+'</p><p class="muted">Rishikues: '+esc(c.reviewers.join(', ')||'asnjë')+'</p><div class="actions"><select data-status><option value="voting_open">Prano dhe hap votimin</option><option value="needs_changes">Kërko ndryshime</option><option value="rejected">Refuzo (2 persona)</option><option value="duplicate">Dublikatë (2 persona)</option></select><textarea data-note placeholder="Arsyeja publike"></textarea><input data-duplicate placeholder="ID kryesor, vetëm për dublikatë"><button data-id="'+esc(c.proposalId)+'">Regjistro vendimin</button></div></article>').join('');document.querySelectorAll('[data-id]').forEach(b=>b.onclick=async()=>{const card=b.closest('.case');const status=card.querySelector('[data-status]').value;const body={status,note:card.querySelector('[data-note]').value};const duplicate=card.querySelector('[data-duplicate]').value;if(duplicate)body.duplicateOf=duplicate;const r=await fetch('/v1/proposals/'+b.dataset.id+'/moderate',{method:'POST',headers:headers(),body:JSON.stringify(body)});q('#status').textContent=r.ok?'Vendimi u regjistrua.':'Vendimi dështoi.';if(r.ok)q('#load').click()})};q('#record-response').onclick=async()=>{const body={institution:q('#response-institution').value,status:q('#response-status').value,note:q('#response-note').value};const text=q('#response-text').value;const url=q('#response-url').value;if(text)body.responseText=text;if(url)body.sourceUrl=url;const r=await fetch('/v1/proposals/'+encodeURIComponent(q('#response-id').value)+'/institutional-response',{method:'POST',headers:headers(),body:JSON.stringify(body)});q('#status').textContent=r.ok?'Gjendja institucionale u regjistrua.':'Regjistrimi dështoi.'};</script></body></html>`;
const dashboardPage = dashboard.replace("</style>", ".case p{white-space:pre-line}</style>");

export function buildApp(
  options: {
    auditStore?: AdminAuditStore;
    fetchImpl?: typeof fetch;
    civicUrl?: string;
    notificationsUrl?: string;
    adminKey?: string;
  } = {},
) {
  const app = Fastify({ logger: false, bodyLimit: 12_000 });
  const civicUrl = options.civicUrl ?? process.env.CIVIC_API_URL ?? "http://localhost:4000";
  const notificationsUrl =
    options.notificationsUrl ?? process.env.NOTIFICATIONS_URL ?? "http://localhost:4004";
  const adminKey = options.adminKey ?? process.env.ADMIN_API_KEY ?? "development-admin-key";
  const fetchImpl = options.fetchImpl ?? fetch;
  const auditStore = options.auditStore ?? new MemoryAdminAuditStore();

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header(
      "content-security-policy",
      "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
    reply.header("x-frame-options", "DENY");
    reply.header("cache-control", "no-store");
    return payload;
  });

  function identity(request: { headers: Record<string, unknown> }) {
    const authorized = request.headers.authorization === `Bearer ${adminKey}`;
    const actor = request.headers["x-admin-actor"];
    return { authorized, actor: typeof actor === "string" && actor.trim() ? actor.trim() : "" };
  }

  app.get("/health", async () => ({
    ok: true,
    separateTrustDomain: true,
    auditStore: auditStore.kind,
    authentication: "synthetic-admin-key",
  }));
  app.get("/", async (_request, reply) => reply.type("text/html").send(dashboardPage));
  app.get("/favicon.ico", async (_request, reply) => reply.code(204).send());

  app.get("/v1/moderation-cases", async (request, reply) => {
    const auth = identity(request);
    if (!auth.authorized || !auth.actor) return reply.code(401).send({ error: "unauthorized" });
    const response = await fetchImpl(`${civicUrl}/internal/moderation-cases`, {
      headers: { "x-admin-key": adminKey },
    });
    const data = (await response.json()) as {
      cases?: Array<{
        reason: string;
        proposal?: { title: string; problem: string; proposedChange: string };
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };
    if (data.cases) {
      data.cases = data.cases.map((moderationCase) => ({
        ...moderationCase,
        reason: moderationCase.proposal
          ? `${moderationCase.proposal.title}\n\nProblemi: ${moderationCase.proposal.problem}\n\nNdryshimi: ${moderationCase.proposal.proposedChange}\n\nRasti: ${moderationCase.reason}`
          : moderationCase.reason,
      }));
    }
    return reply.code(response.status).send(data);
  });

  app.get("/v1/audit-events", async (request, reply) => {
    const auth = identity(request);
    if (!auth.authorized || !auth.actor) return reply.code(401).send({ error: "unauthorized" });
    return { events: await auditStore.list() };
  });

  app.post<{ Params: { id: string } }>("/v1/proposals/:id/moderate", async (request, reply) => {
    const auth = identity(request);
    if (!auth.authorized || !auth.actor) return reply.code(401).send({ error: "unauthorized" });
    const parsed = moderationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_moderation" });
    const response = await fetchImpl(
      `${civicUrl}/internal/proposals/${request.params.id}/moderate`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ ...parsed.data, reviewer: auth.actor }),
      },
    );
    const responseData = (await response.json()) as {
      applied?: boolean;
      proposal?: { id: string; title: string; category: string };
      [key: string]: unknown;
    };
    await auditStore.append({
      actor: auth.actor,
      action: `moderate:${parsed.data.status}`,
      target: request.params.id,
      outcome: response.ok ? "accepted" : "failed",
    });
    if (
      response.ok &&
      parsed.data.status === "voting_open" &&
      responseData.applied &&
      responseData.proposal?.title &&
      responseData.proposal.category
    ) {
      const noticeResponse = await fetchImpl(`${notificationsUrl}/internal/publish`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          title: responseData.proposal.title,
          url: `/propozime/${request.params.id}`,
          category: responseData.proposal.category,
        }),
      }).catch(() => undefined);
      await auditStore.append({
        actor: auth.actor,
        action: "publish:voting-open-notification",
        target: request.params.id,
        outcome: noticeResponse?.ok ? "accepted" : "failed",
      });
    }
    return reply.code(response.status).send(responseData);
  });

  app.post<{ Params: { id: string } }>(
    "/v1/proposals/:id/institutional-response",
    async (request, reply) => {
      const auth = identity(request);
      if (!auth.authorized || !auth.actor) return reply.code(401).send({ error: "unauthorized" });
      const parsed = responseSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_response" });
      const response = await fetchImpl(
        `${civicUrl}/internal/proposals/${request.params.id}/institutional-response`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-admin-key": adminKey },
          body: JSON.stringify({ ...parsed.data, recordedBy: auth.actor }),
        },
      );
      await auditStore.append({
        actor: auth.actor,
        action: `institutional-response:${parsed.data.status}`,
        target: request.params.id,
        outcome: response.ok ? "accepted" : "failed",
      });
      return reply.code(response.status).send(await response.json());
    },
  );
  return app;
}
