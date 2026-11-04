import { REGRAS_AGENTE, REFERENCIAS, EVIDENCIAS } from "@/data/trading-metodologia";

export function MethodologySection() {
  return (
    <div className="grid gap-12">
      <div>
        <h3 className="text-xl font-serif text-foreground mb-5">As regras que o agente segue</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGRAS_AGENTE.map((r) => (
            <div key={r.titulo} className="rounded-xl border border-border bg-card/40 p-5">
              <div className="text-gold font-semibold text-sm mb-1">{r.titulo}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.texto}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-serif text-foreground mb-5">Como as melhores referências fazem</h3>
        <div className="grid gap-3">
          {REFERENCIAS.map((r) => (
            <div key={r.nome} className="rounded-xl border border-border bg-card/40 p-5 grid md:grid-cols-[180px_1fr_1fr] gap-3">
              <div className="text-foreground font-semibold">{r.nome}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.oQueFaz}</p>
              <p className="text-sm text-foreground/80 leading-relaxed"><span className="text-gold text-xs uppercase tracking-[0.15em] mr-2">Lição</span>{r.licao}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-serif text-foreground mb-5">O que a evidência diz sobre o que funciona</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {EVIDENCIAS.map((e) => (
            <div key={e.titulo} className="rounded-xl border border-border bg-card/40 p-5">
              <div className="text-foreground font-semibold text-sm mb-1">{e.titulo}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{e.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
