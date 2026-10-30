import { useCallback, useEffect, useMemo, useState } from "react";
import { adminSupabase } from "@/lib/adminSupabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

type Nivel = "A" | "B" | "C";

type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  segmento: string | null;
  segmento_relacionamento: Nivel;
  opt_in_email: boolean | null;
  opt_in_whatsapp: boolean | null;
  opt_out_at: string | null;
  ultimo_contato_em: string | null;
  proxima_acao_em: string | null;
};

const CANAIS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "ligacao", label: "Ligação" },
  { value: "reuniao", label: "Reunião" },
  { value: "presencial", label: "Presencial" },
  { value: "outro", label: "Outro" },
];

// Regra de cadência: A = mensal, B = mensal, C = trimestral.
const DIAS_PROXIMA_ACAO: Record<Nivel, number> = { A: 30, B: 30, C: 90 };

function formatarTelefone(t: string | null): string {
  if (!t) return "—";
  const d = t.replace(/\D/g, "");
  if (d.length !== 13) return t;
  return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
}

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function somarDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="text-3xl font-extrabold text-slate-100">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function OptBadge({ ativo, optOut }: { ativo: boolean | null; optOut: boolean }) {
  if (optOut) return <Badge variant="destructive">Saiu</Badge>;
  return ativo ? (
    <Badge className="bg-teal-500/20 text-teal-300 hover:bg-teal-500/20 border border-teal-500/40">Sim</Badge>
  ) : (
    <Badge variant="outline" className="text-slate-400 border-slate-700">Não</Badge>
  );
}

export default function Clientes() {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [paraHoje, setParaHoje] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [filtroOptIn, setFiltroOptIn] = useState("todos");

  const [alvo, setAlvo] = useState<Cliente | null>(null);
  const [canal, setCanal] = useState("whatsapp");
  const [tipo, setTipo] = useState("");
  const [resumo, setResumo] = useState("");
  const [dataProxima, setDataProxima] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const [lista, hoje] = await Promise.all([
      adminSupabase
        .from("clientes")
        .select(
          "id,nome,telefone,email,segmento,segmento_relacionamento,opt_in_email,opt_in_whatsapp,opt_out_at,ultimo_contato_em,proxima_acao_em",
        )
        .order("nome")
        .limit(5000),
      adminSupabase.from("clientes_para_contatar_hoje").select("id", { count: "exact", head: true }),
    ]);
    if (lista.error) setErro(lista.error.message);
    else {
      setErro(null);
      setClientes((lista.data as Cliente[]) ?? []);
    }
    setParaHoje(hoje.count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const qDigitos = q.replace(/\D/g, "");
    return clientes.filter((c) => {
      if (q) {
        const okNome = c.nome.toLowerCase().includes(q);
        const okTel = qDigitos.length > 0 && (c.telefone ?? "").includes(qDigitos);
        if (!okNome && !okTel) return false;
      }
      if (filtroNivel !== "todos" && c.segmento_relacionamento !== filtroNivel) return false;
      const saiu = !!c.opt_out_at;
      if (filtroOptIn === "email" && !(c.opt_in_email && !saiu)) return false;
      if (filtroOptIn === "whatsapp" && !(c.opt_in_whatsapp && !saiu)) return false;
      if (filtroOptIn === "sem" && (c.opt_in_email || c.opt_in_whatsapp || saiu)) return false;
      if (filtroOptIn === "saiu" && !saiu) return false;
      return true;
    });
  }, [clientes, busca, filtroNivel, filtroOptIn]);

  const totalEmail = clientes.filter((c) => c.opt_in_email && !c.opt_out_at).length;
  const totalWhats = clientes.filter((c) => c.opt_in_whatsapp && !c.opt_out_at).length;

  async function atualizarCampo(id: string, campos: Partial<Cliente>) {
    const anterior = clientes;
    setClientes((cs) => cs.map((c) => (c.id === id ? { ...c, ...campos } : c)));
    const { error } = await adminSupabase.from("clientes").update(campos).eq("id", id);
    if (error) {
      setClientes(anterior);
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
    }
  }

  function abrirContato(c: Cliente) {
    setAlvo(c);
    setCanal("whatsapp");
    setTipo("");
    setResumo("");
    setDataProxima("");
  }

  async function registrarContato() {
    if (!alvo) return;
    setSalvando(true);
    const agora = new Date().toISOString();
    const proxima = dataProxima || somarDias(DIAS_PROXIMA_ACAO[alvo.segmento_relacionamento] ?? 90);

    const ins = await adminSupabase.from("interacoes").insert({
      cliente_id: alvo.id,
      canal,
      tipo: tipo.trim() || null,
      resumo: resumo.trim() || null,
      em: agora,
    });
    if (ins.error) {
      setSalvando(false);
      toast({ title: "Não foi possível registrar", description: ins.error.message, variant: "destructive" });
      return;
    }
    const upd = await adminSupabase
      .from("clientes")
      .update({ ultimo_contato_em: agora, proxima_acao_em: proxima })
      .eq("id", alvo.id);
    setSalvando(false);
    if (upd.error) {
      toast({ title: "Contato salvo, mas a próxima ação não", description: upd.error.message, variant: "destructive" });
    } else {
      toast({ title: "Contato registrado", description: `Próxima ação: ${formatarData(proxima + "T12:00:00")}.` });
    }
    setAlvo(null);
    carregar();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Clientes</h1>
        <p className="text-sm text-slate-400">Carteira, consentimento e rotina de relacionamento.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total de clientes" value={clientes.length} />
        <Stat label="Opt-in e-mail" value={totalEmail} />
        <Stat label="Opt-in WhatsApp" value={totalWhats} />
        <Stat label="Para contatar hoje" value={paraHoje} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="bg-slate-900 border-slate-700 sm:max-w-xs"
        />
        <Select value={filtroNivel} onValueChange={setFiltroNivel}>
          <SelectTrigger className="bg-slate-900 border-slate-700 sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os níveis</SelectItem>
            <SelectItem value="A">Nível A</SelectItem>
            <SelectItem value="B">Nível B</SelectItem>
            <SelectItem value="C">Nível C</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroOptIn} onValueChange={setFiltroOptIn}>
          <SelectTrigger className="bg-slate-900 border-slate-700 sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Qualquer consentimento</SelectItem>
            <SelectItem value="email">Com opt-in de e-mail</SelectItem>
            <SelectItem value="whatsapp">Com opt-in de WhatsApp</SelectItem>
            <SelectItem value="sem">Sem opt-in</SelectItem>
            <SelectItem value="saiu">Pediram para sair</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          Não foi possível carregar os clientes: {erro}. Confirme se a migração de clientes foi aplicada.
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>E-mail ok</TableHead>
              <TableHead>WhatsApp ok</TableHead>
              <TableHead>Último contato</TableHead>
              <TableHead>Próxima ação</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={10} className="text-center text-slate-500">Carregando…</TableCell></TableRow>
            )}
            {!loading && filtrados.length === 0 && (
              <TableRow><TableCell colSpan={10} className="text-center text-slate-500">Nenhum cliente encontrado.</TableCell></TableRow>
            )}
            {filtrados.map((c) => (
              <TableRow key={c.id} className="border-slate-800">
                <TableCell className="font-semibold whitespace-nowrap">{c.nome}</TableCell>
                <TableCell className="whitespace-nowrap">{formatarTelefone(c.telefone)}</TableCell>
                <TableCell className="text-slate-300">{c.email ?? "—"}</TableCell>
                <TableCell>{c.segmento ?? "—"}</TableCell>
                <TableCell>
                  <Select
                    value={c.segmento_relacionamento}
                    onValueChange={(v) => atualizarCampo(c.id, { segmento_relacionamento: v as Nivel })}
                  >
                    <SelectTrigger className="h-8 w-16 bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><OptBadge ativo={c.opt_in_email} optOut={!!c.opt_out_at} /></TableCell>
                <TableCell><OptBadge ativo={c.opt_in_whatsapp} optOut={!!c.opt_out_at} /></TableCell>
                <TableCell className="whitespace-nowrap">{formatarData(c.ultimo_contato_em)}</TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={c.proxima_acao_em ?? ""}
                    onChange={(e) => atualizarCampo(c.id, { proxima_acao_em: e.target.value || null })}
                    className="h-8 w-40 bg-slate-950 border-slate-700"
                  />
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="secondary" onClick={() => abrirContato(c)}>
                    Registrar contato
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!alvo} onOpenChange={(o) => !o && setAlvo(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Registrar contato</DialogTitle>
            <DialogDescription>{alvo?.nome}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CANAIS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Input
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ex.: revisão de carteira, aniversário, indicação"
                className="bg-slate-950 border-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resumo">Resumo</Label>
              <Textarea
                id="resumo"
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                rows={4}
                className="bg-slate-950 border-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proxima">Próxima ação (opcional)</Label>
              <Input
                id="proxima"
                type="date"
                value={dataProxima}
                onChange={(e) => setDataProxima(e.target.value)}
                className="bg-slate-950 border-slate-700"
              />
              <p className="text-xs text-slate-500">
                Em branco: {alvo ? DIAS_PROXIMA_ACAO[alvo.segmento_relacionamento] : 90} dias a partir de hoje
                (nível {alvo?.segmento_relacionamento}).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAlvo(null)}>Cancelar</Button>
            <Button onClick={registrarContato} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar contato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
