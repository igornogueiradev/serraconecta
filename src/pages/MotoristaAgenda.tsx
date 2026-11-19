import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone } from 'lucide-react';
import { getAgendaMotorista } from '@/integrations/firebase/motoristas';
import { linkWhatsApp } from '@/utils/whatsapp';
import type { AgendaMotorista, ServicoMotorista } from '@/integrations/firebase/types';

function tituloDia(data: string) {
  const d = new Date(`${data}T12:00:00`);
  if (isToday(d)) return 'Hoje';
  if (isTomorrow(d)) return 'Amanhã';
  const outroAno = d.getFullYear() !== new Date().getFullYear();
  return format(d, outroAno ? "EEEE, dd 'de' MMMM 'de' yyyy" : "EEEE, dd 'de' MMMM", { locale: ptBR });
}

function Linha({ label, valor }: { label: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-right text-slate-700">{valor}</span>
    </div>
  );
}

function CardServico({ s }: { s: ServicoMotorista }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-blue-700">{s.hora}{s.hora_fim ? ` – ${s.hora_fim}` : ''}</span>
          <span className="text-sm font-medium text-slate-700">{s.tipo}</span>
        </div>
        {s.trecho && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            s.trecho === 'IN' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
          }`}>
            {s.trecho === 'IN' ? '🛬 IN' : '🛫 OUT'}
          </span>
        )}
      </div>
      <Linha label="Rota" valor={s.rota} />
      <Linha label="Embarque" valor={s.embarque} />
      <Linha label="Hotel" valor={s.hotel} />
      <Linha label="Voo" valor={s.voo} />
      <Linha label="Cliente" valor={s.cliente_nome} />
      <Linha label="Passageiros" valor={s.passageiros} />
      <Linha label="Bagagens" valor={s.bagagens} />
      <Linha label="Atenção" valor={s.equipamentos} />
      {s.observacao && <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mt-1">{s.observacao}</p>}
      {s.observacao_cliente && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">Cliente: {s.observacao_cliente}</p>
      )}
      {s.cliente_telefone && (
        <a href={linkWhatsApp(s.cliente_telefone, `Olá, ${s.cliente_nome?.split(' ')[0] ?? ''}! Sou o motorista do seu transfer.`)}
          target="_blank" rel="noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-xl py-2 font-medium">
          <Phone size={14} /> {s.cliente_telefone}
        </a>
      )}
    </div>
  );
}

export default function MotoristaAgenda() {
  const { token } = useParams<{ token: string }>();
  const [agenda, setAgenda] = useState<AgendaMotorista | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!token) return;
    getAgendaMotorista(token)
      .then(setAgenda)
      .catch(() => setAgenda(null))
      .finally(() => setCarregando(false));
  }, [token]);

  if (carregando) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  );

  if (!agenda) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
        <p className="text-3xl mb-3">🔒</p>
        <h2 className="font-semibold text-slate-800 mb-2">Link inválido</h2>
        <p className="text-slate-500 text-sm">Este link não existe ou foi desativado. Peça um novo link.</p>
      </div>
    </div>
  );

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const proximos = agenda.servicos.filter(s => s.data >= hoje);
  const dias = [...new Set(proximos.map(s => s.data))];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        <div style={{ background: '#13324a' }} className="rounded-2xl px-5 py-4 text-white flex items-center gap-3">
          <img src="/LOGO.png" alt="logo" className="w-10 h-10 object-cover rounded-md" />
          <div>
            <p className="font-bold leading-tight">Agenda de {agenda.motorista_nome}</p>
            <p className="text-xs opacity-60">Meu Executivo Gramado · próximos serviços</p>
          </div>
        </div>

        {dias.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-sm text-slate-500">
            Nenhum serviço agendado no momento.
          </div>
        )}

        {dias.map(dia => (
          <div key={dia} className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
              {tituloDia(dia)} · {dia.split('-').reverse().join('/')}
            </p>
            {proximos.filter(s => s.data === dia).map((s, i) => <CardServico key={i} s={s} />)}
          </div>
        ))}

        <p className="text-center text-xs text-slate-400">
          Atualizado em {format(new Date(agenda.atualizado_em), "dd/MM/yyyy 'às' HH:mm")}
        </p>
      </div>
    </div>
  );
}
