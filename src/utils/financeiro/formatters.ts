import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PeriodoFiltro } from '@/integrations/firebase/types';

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Strings YYYY-MM-DD são UTC por padrão no JS — força meio-dia local para evitar -1 dia
function toLocalDate(d: string | Date): Date {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + 'T12:00:00');
  return new Date(d);
}

export function formatarData(data: string | Date): string {
  return format(toLocalDate(data), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatarDataCurta(data: string | Date): string {
  return format(toLocalDate(data), 'dd/MM', { locale: ptBR });
}

export function formatarDiaSemana(data: string | Date): string {
  return format(toLocalDate(data), 'EEEE', { locale: ptBR });
}

export function formatarMesAno(data: string | Date): string {
  return format(toLocalDate(data), 'MMMM yyyy', { locale: ptBR });
}

export function formatarPercent(valor: number): string {
  return `${valor.toFixed(1)}%`;
}

export function formatarKm(km: number): string {
  return `${km.toLocaleString('pt-BR')} km`;
}

export function getRangePeriodo(
  periodo: PeriodoFiltro,
  dataInicio?: Date,
  dataFim?: Date
): { inicio: Date; fim: Date } {
  const hoje = new Date();
  switch (periodo) {
    case 'hoje':
      return { inicio: startOfDay(hoje), fim: endOfDay(hoje) };
    case 'semana':
      return { inicio: startOfWeek(hoje, { locale: ptBR }), fim: endOfWeek(hoje, { locale: ptBR }) };
    case 'mes':
      return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
    case 'personalizado':
      return { inicio: startOfDay(dataInicio ?? hoje), fim: endOfDay(dataFim ?? hoje) };
    case 'geral':
      return { inicio: new Date(2000, 0, 1), fim: new Date(2099, 11, 31) };
  }
}

export function labelPeriodo(periodo: PeriodoFiltro): string {
  const map: Record<PeriodoFiltro, string> = {
    hoje: 'Hoje',
    semana: 'Esta semana',
    mes: 'Este mês',
    geral: 'Geral',
    personalizado: 'Período personalizado',
  };
  return map[periodo];
}

export const LABEL_APP: Record<string, string> = {
  uber: 'Uber',
  '99': '99',
  blablacar: 'BlaBlaCar',
  outro: 'Outro',
};

export const LABEL_TIPO_PARTICULAR: Record<string, string> = {
  particular: 'Particular',
  transfer: 'Transfer',
  citytour: 'CityTour',
  passeios: 'Passeios',
  outro: 'Outro',
};

export const LABEL_TIPO_AGENDAMENTO: Record<string, string> = {
  transfer: 'Transfer',
  transfer_poa: 'Transfer',
  transfer_caxias: 'Transfer',
  passeio: 'Passeio / Tour',
  fretamento: 'Fretamento',
  outro: 'Outro',
};

export const LABEL_STATUS: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const COR_STATUS: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700',
  confirmado: 'bg-green-100 text-green-700',
  concluido: 'bg-slate-100 text-slate-500',
  cancelado: 'bg-red-100 text-red-600',
};

export const LABEL_CATEGORIA: Record<string, string> = {
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  pedagio: 'Pedágio',
  outro: 'Outros',
};

export const COR_CATEGORIA: Record<string, string> = {
  combustivel: '#f97316',
  manutencao: '#8b5cf6',
  pedagio: '#06b6d4',
  outro: '#6b7280',
};

export const COR_APP: Record<string, string> = {
  uber: '#000000',
  '99': '#f97316',
  blablacar: '#1d4ed8',
  outro: '#6b7280',
  particular: '#1d4ed8',
};
