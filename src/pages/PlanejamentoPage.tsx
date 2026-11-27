import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Footer } from "@/components/Footer";
import { ComplianceNotice } from "@/components/ComplianceNotice";

const GOLD = "hsl(42 85% 55%)";
const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const campo =
  "w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-[14px] text-foreground placeholder:text-white/30 focus:outline-none focus:border-[hsl(42_85%_55%/0.6)]";

const FAIXA_RENDA = ["Até R$ 5 mil", "R$ 5 a 10 mil", "R$ 10 a 20 mil", "R$ 20 a 40 mil", "Acima de R$ 40 mil", "Prefiro não informar"];
const FAIXA_DESPESA = ["Até R$ 3 mil", "R$ 3 a 6 mil", "R$ 6 a 10 mil", "R$ 10 a 20 mil", "Acima de R$ 20 mil", "Prefiro não informar"];
const FAIXA_VALOR = ["Não tenho", "Até R$ 200 mil", "R$ 200 a 500 mil", "R$ 500 mil a 1 milhão", "Acima de R$ 1 milhão", "Prefiro não informar"];
const FAIXA_DIVIDA = ["Não tenho", "Até R$ 50 mil", "R$ 50 a 200 mil", "R$ 200 a 500 mil", "Acima de R$ 500 mil", "Prefiro não informar"];
const ESTADO_CIVIL = ["Solteiro(a)", "Casado(a) ou união estável", "Divorciado(a)", "Viúvo(a)", "Prefiro não informar"];
const OBJETIVOS = ["Reserva de emergência", "Aposentadoria", "Comprar casa ou imóvel", "Estudos dos filhos", "Viagem", "Trocar de carro", "Abrir ou ampliar um negócio", "Proteção da família (seguros e sucessão)"];
const PRAZOS = ["Até 2 anos", "2 a 5 anos", "5 a 10 anos", "Mais de 10 anos"];

type Resp = {
  estadoCivil: string; dependentes: string; profissao: string; vinculo: string; renda: string;
  despesa: string; imoveis: string; veiculos: string; dividas: string; foraXp: string;
  objetivos: string[]; prazo: string; preocupacao: string;
};
const VAZIO: Resp = { estadoCivil: "", dependentes: "", profissao: "", vinculo: "", renda: "", despesa: "", imoveis: "", veiculos: "", dividas: "", foraXp: "", objetivos: [], prazo: "", preocupacao: "" };

function Lista({ rotulo, opcoes, valor, onChange }: { rotulo: string; opcoes: string[]; valor: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[12px] text-white/55 mb-1.5">{rotulo}</label>
      <select className={campo} value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Escolher</option>
        {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function PlanejamentoPage() {
  const [params] = useSearchParams();
  const token = (params.get("t") || "").trim();
  const [r, setR] = useState<Resp>(VAZIO);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);
  const set = <K extends keyof Resp>(k: K, v: Resp[K]) => setR((s) => ({ ...s, [k]: v }));

  useEffect(() => { document.title = "Seu Planejamento Financeiro | Saga Financeira"; }, []);

  const tokenValido = TOKEN_RE.test(token);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!consent) return setErro("Para continuar, marque a autorização no fim do formulário.");
    const preenchidos = Object.values(r).filter((v) => (Array.isArray(v) ? v.length : String(v).trim())).length;
    if (preenchidos < 3) return setErro("Responda pelo menos três perguntas para eu conseguir começar o seu plano.");
    if (website) return setOk(true); // honeypot
    if (!supabase) return setErro("O envio está indisponível agora. Tente de novo em instantes.");
    setEnviando(true);
    const { error } = await supabase.from("planejamento_respostas").insert({ token, respostas: r, consentimento: true });
    setEnviando(false);
    if (error) return setErro("Não consegui registrar agora. Confira se abriu o link do seu e-mail e tente de novo.");
    setOk(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-6 lg:px-10 max-w-2xl py-14">
        <p className="text-[11px] tracking-[0.25em] uppercase" style={{ color: GOLD }}>Saga Financeira</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight">Seu Planejamento Financeiro</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/60">
          São cerca de 10 minutos. Responda o que quiser: o que ficar em branco eu converso com você depois. Valores aproximados
          bastam.
        </p>

        {!tokenValido ? (
          <p className="mt-10 rounded-xl border border-white/10 p-5 text-[14px] text-white/70">
            Este formulário é pessoal. Abra o link que enviei ao seu e-mail, ou peça um novo pelo WhatsApp (62) 99416-0930.
          </p>
        ) : ok ? (
          <div className="mt-10 rounded-xl border border-[hsl(42_85%_55%/0.5)] bg-[hsl(42_85%_55%/0.06)] p-6">
            <ShieldCheck className="h-6 w-6" style={{ color: GOLD }} aria-hidden />
            <h2 className="mt-3 font-serif text-xl">Recebi, obrigado.</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-white/65">
              Vou montar o seu planejamento com essas informações e te chamo para conversarmos sobre o resultado.
            </p>
          </div>
        ) : (
          <form onSubmit={enviar} noValidate className="mt-10 space-y-7">
            <fieldset className="space-y-4">
              <legend className="text-[13px] font-semibold text-white/80 mb-2">Você e a sua família</legend>
              <div className="grid sm:grid-cols-2 gap-4">
                <Lista rotulo="Estado civil" opcoes={ESTADO_CIVIL} valor={r.estadoCivil} onChange={(v) => set("estadoCivil", v)} />
                <div>
                  <label htmlFor="dep" className="block text-[12px] text-white/55 mb-1.5">Quantos dependentes (filhos ou outros)?</label>
                  <input id="dep" className={campo} inputMode="numeric" maxLength={2} value={r.dependentes} onChange={(e) => set("dependentes", e.target.value.replace(/\D/g, ""))} />
                </div>
                <div>
                  <label htmlFor="prof" className="block text-[12px] text-white/55 mb-1.5">Profissão</label>
                  <input id="prof" className={campo} maxLength={80} value={r.profissao} onChange={(e) => set("profissao", e.target.value)} />
                </div>
                <Lista rotulo="Como você trabalha" opcoes={["Servidor público", "Empregado (CLT)", "Autônomo ou profissional liberal", "Empresário", "Aposentado", "Outro"]} valor={r.vinculo} onChange={(v) => set("vinculo", v)} />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-[13px] font-semibold text-white/80 mb-2">Dinheiro que entra e que sai (aproximado, por mês)</legend>
              <div className="grid sm:grid-cols-2 gap-4">
                <Lista rotulo="Renda mensal da família" opcoes={FAIXA_RENDA} valor={r.renda} onChange={(v) => set("renda", v)} />
                <Lista rotulo="Despesa mensal da família" opcoes={FAIXA_DESPESA} valor={r.despesa} onChange={(v) => set("despesa", v)} />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-[13px] font-semibold text-white/80 mb-2">O que você tem e o que deve</legend>
              <div className="grid sm:grid-cols-2 gap-4">
                <Lista rotulo="Imóveis (valor somado)" opcoes={FAIXA_VALOR} valor={r.imoveis} onChange={(v) => set("imoveis", v)} />
                <Lista rotulo="Veículos (valor somado)" opcoes={FAIXA_VALOR} valor={r.veiculos} onChange={(v) => set("veiculos", v)} />
                <Lista rotulo="Dívidas e financiamentos (saldo devedor)" opcoes={FAIXA_DIVIDA} valor={r.dividas} onChange={(v) => set("dividas", v)} />
                <Lista rotulo="Investimentos em outras instituições" opcoes={FAIXA_VALOR} valor={r.foraXp} onChange={(v) => set("foraXp", v)} />
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-[13px] font-semibold text-white/80 mb-2">O que você quer conquistar</legend>
              <div className="grid sm:grid-cols-2 gap-2">
                {OBJETIVOS.map((o) => {
                  const ativo = r.objetivos.includes(o);
                  return (
                    <button key={o} type="button" aria-pressed={ativo}
                      onClick={() => set("objetivos", ativo ? r.objetivos.filter((x) => x !== o) : [...r.objetivos, o])}
                      className={`text-left px-4 py-3 rounded-xl border text-[13.5px] transition-all ${ativo ? "border-[hsl(42_85%_55%/0.65)] bg-[hsl(42_85%_55%/0.08)] text-[hsl(42_85%_62%)]" : "border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-white/20"}`}>
                      {o}
                    </button>
                  );
                })}
              </div>
              <Lista rotulo="Em quanto tempo você quer o principal objetivo?" opcoes={PRAZOS} valor={r.prazo} onChange={(v) => set("prazo", v)} />
              <div>
                <label htmlFor="pre" className="block text-[12px] text-white/55 mb-1.5">O que mais te preocupa hoje com o seu dinheiro? (opcional)</label>
                <textarea id="pre" className={campo} rows={3} maxLength={400} value={r.preocupacao} onChange={(e) => set("preocupacao", e.target.value)} />
              </div>
            </fieldset>

            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={website} onChange={(e) => setWebsite(e.target.value)} />

            <label htmlFor="consent" className="flex items-start gap-3 text-[12px] leading-relaxed text-white/50 cursor-pointer">
              <input id="consent" type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(42_85%_55%)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                Autorizo Rainiere Rocha a usar estas informações apenas para montar e atualizar o meu Planejamento Financeiro.
                Elas ficam guardadas com acesso restrito, não são vendidas nem repassadas a terceiros, e posso pedir para
                apagá-las a qualquer momento pelo e-mail contato@sagafin.com.br.
              </span>
            </label>

            {erro && <p role="alert" className="text-[13px] text-red-400">{erro}</p>}

            <button type="submit" disabled={enviando}
              className="w-full py-4 text-[11px] tracking-[0.2em] uppercase font-semibold text-background rounded-sm transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(38 78% 42%))` }}>
              {enviando ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Enviando…</>) : "Enviar minhas respostas"}
            </button>
          </form>
        )}

        <div className="mt-12"><ComplianceNotice /></div>
      </main>
      <Footer />
    </div>
  );
}
