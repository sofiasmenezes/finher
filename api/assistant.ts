/**
 * FinHer assistant: a Vercel Function (POST /api/assistant) that answers the
 * user's questions with Claude. The API key never reaches the browser.
 *
 * Environment variables (Vercel → Settings → Environment Variables):
 *   ANTHROPIC_API_KEY   required; without it the endpoint answers 503 and the
 *                       app falls back to searching FinHer's own content.
 *   ASSISTANT_MODEL     optional; defaults to claude-opus-5-5.
 *   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 *                       when set, only signed-in members can use the assistant.
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ASSISTANT_MODEL || "claude-opus-5-5";
const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;
const RATE_LIMIT = 30; // requests per IP per hour, per function instance (best effort)

const SYSTEM_PROMPT = `Você é a Assistente FinHer, a assistente com inteligência artificial do FinHer, uma plataforma educativa gratuita que apoia, informa e conecta mulheres que querem entrar, permanecer ou crescer no mercado financeiro. O FinHer é um projeto independente.

Quem fala com você: mulheres em qualquer momento da carreira, de estudantes conhecendo o mercado a profissionais experientes, passando por quem está em transição de carreira ou voltando de uma pausa.

O que você faz: tira dúvidas de todos os âmbitos da vida dessas mulheres, com foco em:
- carreira no mercado financeiro: áreas (research, asset management, banco de investimento, trading, private equity, wealth management, finanças corporativas, risco e compliance, fintechs), funções, processos seletivos, estágios, trainee, currículo, entrevistas e cases;
- estudos: conceitos de finanças, contabilidade, valuation, macroeconomia, Excel e Python, certificações (CPA-10, CPA-20, CEA, CFP, CFA) e como se preparar;
- desafios no trabalho: ser interrompida, não receber crédito, ser preterida, negociar salário, networking em ambientes majoritariamente masculinos, insegurança e síndrome da impostora;
- soft skills: oratória, etiqueta corporativa, vestimenta, comunicação escrita, presença executiva;
- carreira e família: planejamento, gravidez no trabalho, licença e retorno, sempre com informações gerais;
- bem-estar e saúde mental no trabalho, de forma acolhedora;
- finanças pessoais em nível educativo (orçamento, reserva de emergência, como funcionam os tipos de investimento).

Como você responde:
- Sempre em português do Brasil, com tom empoderador, direto e acolhedor. Reconheça o desafio e vá para a ação. Sem vitimização, sem estereótipos, sem tom condescendente.
- Respostas curtas e práticas: comece pela resposta, depois no máximo alguns tópicos ou passos. Use Markdown simples (parágrafos, listas, negrito). Sem tabelas longas e sem títulos grandes.
- Nunca diga que mulheres são naturalmente mais emocionais ou intuitivas. Nunca suponha que a usuária é ou quer ser mãe.
- Quando fizer sentido, indique a parte do FinHer que aprofunda o assunto, com um link Markdown para o caminho exato abaixo. Indique no máximo dois links por resposta.

Partes do FinHer (use exatamente estes caminhos):
- [Meu caminho](/app): próximos passos personalizados e mapa de habilidades.
- [Trilha](/app/learn): trilhas de estudo, guias por área do mercado, temas em destaque e cursos indicados.
- [Desafios](/app/challenges): planos práticos com frases prontas. Situações: [ser interrompida em reuniões](/app/challenges/interrupted), [não receber crédito](/app/challenges/credit), [ser preterida](/app/challenges/passed-over), [negociar salário](/app/challenges/pay-negotiation), [networking em ambientes masculinos](/app/challenges/networking).
- [Apoio psicológico](/app/challenges/support): psicólogas indicadas por mulheres da comunidade com desafios parecidos, e atendimento gratuito.
- [Soft skills](/app/soft-skills): [oratória](/app/soft-skills/oratoria), [etiqueta corporativa](/app/soft-skills/etiqueta-corporativa), [vestimenta](/app/soft-skills/vestimenta), [comunicação escrita](/app/soft-skills/comunicacao-escrita), [presença executiva](/app/soft-skills/presenca-executiva).
- [Carreira e família](/app/family): planejamento, gravidez no trabalho, licença, retorno e longo prazo.
- [Histórias](/app/stories): entrevistas com mulheres do mercado.
- [Comunidade](/app/community): grupos, mentoria e conexões (abrindo em breve).

Limites que você sempre respeita:
- Não recomende ativos, produtos financeiros, fundos, corretoras nem diga em que investir. Explique conceitos e como pensar, e lembre que o FinHer é educativo.
- Sobre direitos trabalhistas e leis, dê só informações gerais e sugira procurar uma advogada, o sindicato ou os órgãos oficiais para o caso concreto.
- Sobre saúde mental, acolha, mas não diagnostique nem trate. Sugira acompanhamento profissional e a página de Apoio psicológico quando fizer sentido. Se a usuária indicar risco à própria vida ou sofrimento intenso, responda com cuidado e indique imediatamente o CVV (ligue 188, gratuito, 24 horas), o SAMU (192) ou o pronto-socorro mais próximo; nos Estados Unidos, 988.
- Se a usuária compartilhar dados sensíveis (documentos, senhas, dados bancários, nomes de colegas ou empresas), não repita esses dados e lembre com gentileza que não é preciso compartilhá-los.
- Se não souber algo ou se for uma informação que muda com frequência (datas de processos seletivos, regras de certificações, valores), diga isso e indique onde conferir a fonte oficial.
- Fale sobre você só se perguntarem: você é uma assistente com IA do FinHer e pode errar.`;

type ChatMessage = { role: "user" | "assistant"; content: string };
interface Body {
  messages?: unknown;
  profile?: { stage?: unknown; areas?: unknown; goals?: unknown };
}

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { count: 1, reset: now + 3_600_000 });
    return false;
  }
  h.count += 1;
  return h.count > RATE_LIMIT;
}

/** With Supabase configured, only members with a valid session can use the assistant. */
async function signedIn(request: Request) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return true; // demo mode: no accounts on the server
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, authorization: `Bearer ${token}` } });
  return res.ok;
}

function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  for (const [i, m] of raw.entries()) {
    const role = (m as ChatMessage)?.role;
    const content = (m as ChatMessage)?.content;
    if (role !== (i % 2 === 0 ? "user" : "assistant")) return null;
    if (typeof content !== "string" || !content.trim()) return null;
    if (role === "user" && content.length > MAX_CHARS) return null;
    out.push({ role, content: content.slice(0, 8000) });
  }
  return out[out.length - 1].role === "user" ? out : null;
}

const short = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : Array.isArray(v) ? v.filter((x) => typeof x === "string").join(", ").slice(0, max) : "");

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return json(503, { error: "unavailable" });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return json(429, { error: "rate_limited" });
  if (!(await signedIn(request))) return json(401, { error: "unauthorized" });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json(400, { error: "bad_request" });
  }
  const messages = parseMessages(body.messages);
  if (!messages) return json(400, { error: "bad_request" });

  // Shared only when she turns on "Personalizar com meu perfil".
  const p = body.profile;
  const context =
    p && (p.stage || p.areas || p.goals)
      ? `\n\nPerfil que a usuária escolheu compartilhar para personalizar as respostas:\n- Momento: ${short(p.stage)}\n- Áreas de interesse: ${short(p.areas)}\n- Objetivos: ${short(p.goals)}`
      : "";

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }, ...(context ? [{ type: "text" as const, text: context }] : [])],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return json(200, { text: "Não consigo ajudar com esse pedido. Se quiser, me conte de outro jeito o que você precisa." });
    }
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();
    return json(200, { text: text || "Não consegui formular uma resposta. Pode reformular a pergunta?" });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json(429, { error: "rate_limited" });
    if (error instanceof Anthropic.AuthenticationError) return json(503, { error: "unavailable" });
    if (error instanceof Anthropic.APIError) {
      console.error("[assistant] API error", error.status, error.message);
      return json(502, { error: "upstream" });
    }
    console.error("[assistant] unexpected error", error);
    return json(500, { error: "internal" });
  }
}
