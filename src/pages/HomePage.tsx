import { Link } from "react-router-dom";
import { CalendarDays, DollarSign, Users2, PlusCircle, BarChart2, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { useAgendamentosProximos } from "@/hooks/financeiro/useAgendamentos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HomePageProps {
  userName: string;
  onLogout: () => void;
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomePage({ userName, onLogout }: HomePageProps) {
  const agendamentosProximos = useAgendamentosProximos();
  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header isLoggedIn={true} userName={userName} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">

        <div className="mb-8">
          <p className="text-slate-400 text-sm capitalize">{hoje}</p>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            {saudacao()}, {userName.split(" ")[0]}! 👋
          </h1>
        </div>

        {agendamentosProximos.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Próximos compromissos
            </p>
            <div className="flex flex-col gap-2">
              {agendamentosProximos.map(a => (
                <Link key={`${a.id}-${a.quando}`} to="/financeiro/agenda"
                  className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{a.clienteNome || "Cliente"}</p>
                    <p className="text-xs text-slate-400">
                      {a.quando === 'hoje' ? 'Hoje' : 'Amanhã'} · {a.hora} · {a.destino || a.tipo}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Acesso rápido
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Link to="/leads"
            className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users2 className="w-5 h-5 text-primary" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">Leads</p>
            <p className="text-xs text-slate-400">Pedidos de orçamento</p>
          </Link>

          <Link to="/financeiro/agenda"
            className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">Agenda</p>
            <p className="text-xs text-slate-400">Seus compromissos</p>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Link to="/financeiro/dashboard"
            className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-primary" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">Financeiro</p>
            <p className="text-xs text-slate-400">Dashboard e relatórios</p>
          </Link>

          <Link to="/financeiro/nova-receita"
            className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-primary" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">Nova Receita</p>
            <p className="text-xs text-slate-400">Lançar ganhos do dia</p>
          </Link>
        </div>

        <Link to="/financeiro/novo-agendamento"
          className="w-full bg-primary hover:opacity-90 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-opacity mt-2">
          <CalendarDays size={18} />
          Novo Compromisso
        </Link>

      </main>
    </div>
  );
}
