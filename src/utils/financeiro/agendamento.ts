import type { Agendamento, Lead, LeadVoo, TipoAgendamento } from '@/integrations/firebase/types';

export type LayoutAgendamento = 'transfer' | 'passeio' | 'outro';

export const TIPOS_AGENDAMENTO: TipoAgendamento[] = ['transfer', 'passeio', 'outro'];

export const ROTEIROS = ['Gramado', 'Canela', 'Gramado + Canela', 'Vale dos Vinhedos'];

export function layoutTipo(tipo: string): LayoutAgendamento {
  if (tipo === 'transfer' || tipo === 'transfer_poa' || tipo === 'transfer_caxias') return 'transfer';
  if (tipo === 'passeio' || tipo === 'fretamento') return 'passeio';
  return 'outro';
}

export function isTransfer(tipo: string) {
  return layoutTipo(tipo) === 'transfer';
}

export function labelRota(tipo: string) {
  const layout = layoutTipo(tipo);
  return layout === 'transfer' ? 'Rota' : layout === 'passeio' ? 'Roteiro' : 'Descrição';
}

export function labelOrigem(tipo: string) {
  return layoutTipo(tipo) === 'passeio' ? 'Embarque' : 'Local';
}

export function montarRota(origem?: string, destino?: string) {
  return [origem, destino].map(s => s?.trim()).filter(Boolean).join(' → ');
}

export function separarRota(rota?: string, origem?: string): [string, string] {
  if (!rota) return [origem ?? '', ''];
  if (origem && rota === origem) return [origem, ''];
  if (origem && rota.startsWith(`${origem} → `)) return [origem, rota.slice(origem.length + 3)];
  const i = rota.indexOf('→');
  if (i >= 0) return [rota.slice(0, i).trim(), rota.slice(i + 1).trim()];
  return [origem ?? '', rota];
}

export function formatarVoo(voo?: LeadVoo) {
  if (!voo) return '';
  return [voo.companhia, voo.numero, voo.horario].filter(Boolean).join(' · ');
}

export function formatarPassageiros(adultos?: number, criancas?: number) {
  const partes: string[] = [];
  if (adultos) partes.push(`${adultos} ${adultos === 1 ? 'adulto' : 'adultos'}`);
  if (criancas) partes.push(`${criancas} ${criancas === 1 ? 'criança' : 'crianças'}`);
  return partes.join(', ');
}

export function leadParaAgendamentos(lead: Lead): Partial<Agendamento>[] {
  const base: Partial<Agendamento> = {
    clienteNome: lead.nome,
    clienteTelefone: lead.telefone,
    adultos: lead.adultos || undefined,
    criancas: lead.criancas || undefined,
    observacao: [
      lead.idades_criancas ? `Idade das crianças: ${lead.idades_criancas}` : '',
      lead.mensagem ?? '',
    ].filter(Boolean).join(' · ') || undefined,
  };

  const itens: Partial<Agendamento>[] = [];

  if (lead.transfer) {
    const t = lead.transfer;
    itens.push({
      ...base,
      tipo: 'transfer',
      data: t.data ?? lead.data_desejada,
      hora: t.hora,
      origem: t.origem,
      destino: montarRota(t.origem, t.destino) || undefined,
      ida_e_volta: t.ida_volta,
      data_volta: t.data_volta,
      hora_volta: t.hora_volta,
      voo_ida: lead.voo_ida,
      voo_volta: lead.voo_volta,
    });
  }

  if (lead.city_tour) {
    itens.push({
      ...base,
      tipo: 'passeio',
      data: lead.city_tour.data ?? lead.data_desejada,
      origem: lead.city_tour.embarque,
      destino: lead.city_tour.roteiro,
    });
  }

  if (!itens.length) {
    const passeio = lead.servico === 'city_tour' || lead.servico === 'passeio' || lead.servico === 'vinicola';
    itens.push({
      ...base,
      tipo: passeio ? 'passeio' : 'transfer',
      data: lead.data_desejada,
      destino: lead.destino,
    });
  }

  return itens;
}
