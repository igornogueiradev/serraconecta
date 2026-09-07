export interface UserProfile {
  full_name: string;
  phone: string;
  user_type: string;
  created_at: string;
  rating_avg?: number;
  rating_count?: number;
  logo_url?: string;
  agency_name?: string;
}

export interface Driver {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  vehicle_info: string | null;
  available_seats: number;
  departure_date: string;
  departure_time: string;
  price: number;           // preço por assento (coletivo)
  price_private?: number;  // valor total da viagem (privativo)
  service_type: string;
  has_trailer: boolean;
  has_rooftop_carrier: boolean;
  additional_info: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  profiles?: (UserProfile & { user_id: string }) | null;
}

export interface Trip {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  passengers_count: number;
  adults_count: number;
  children_count: number;
  baggage_23kg: number;
  baggage_10kg: number;
  baggage_bags: number;
  departure_date: string;
  departure_time: string;
  service_type: string;
  price: number;
  additional_info: string | null;
  status: 'active' | 'accepted' | 'completed';
  created_at: string;
  profiles?: (UserProfile & { user_id: string }) | null;
}

export type DriverInsert = Omit<Driver, 'id' | 'created_at' | 'user_id' | 'profiles'>;
export type TripInsert = Omit<Trip, 'id' | 'created_at' | 'user_id' | 'profiles'>;

// ──────────── FINANCEIRO ────────────

export type AppNome = 'uber' | '99' | 'blablacar' | 'outro';
export type TipoParticular = 'particular' | 'transfer' | 'citytour' | 'passeios' | 'outro';
export type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'geral' | 'personalizado';
export type TipoAgendamento = 'transfer' | 'transfer_poa' | 'transfer_caxias' | 'passeio' | 'fretamento' | 'outro';
export type StatusAgendamento = 'agendado' | 'confirmado' | 'concluido' | 'cancelado';

export interface GanhoPorApp {
  app: AppNome;
  appNome?: string;
  valor: number;
  qtdCorridas?: number;
}

export interface Receita {
  id?: string;
  user_id: string;
  data: string; // "yyyy-MM-dd"
  kmTotal: number;
  ganhosPorApp: GanhoPorApp[];
  valorParticular?: number;
  tipoParticular?: TipoParticular;
  destinoParticular?: string;
  pedagioParticular?: number;
  gorjeta?: number;
  comissao?: number;
  comissaoDescricao?: string;
  qtdCorridas?: number;
  observacao?: string;
  created_at?: string;
}

export interface Gasto {
  id?: string;
  user_id: string;
  categoria: 'combustivel' | 'manutencao' | 'pedagio' | 'outro';
  descricao: string;
  valor: number;
  data: string; // "yyyy-MM-dd"
  kmAtual?: number;
  litros?: number;
  receitaId?: string;
  kmTripB?: number;
  kmPessoal?: number;
  observacao?: string;
  created_at?: string;
}

export interface Agendamento {
  id?: string;
  user_id: string;
  data: string; // "yyyy-MM-dd"
  hora: string; // "HH:mm"
  clienteNome?: string;
  tipo: TipoAgendamento;
  destino?: string;
  valorCombinado?: number;
  adiantamentoPago?: number;
  ida_e_volta?: boolean;
  data_volta?: string;
  hora_volta?: string;
  destino_volta?: string;
  direcao?: 'in' | 'out';
  status: StatusAgendamento;
  observacao?: string;
  questionario_enviado?: boolean;
  questionario_respondido?: boolean;
  questionario_edicao_habilitada?: boolean;
  created_at?: string;
}

export interface QuestionarioResposta {
  id?: string;
  agendamento_id: string;
  owner_id: string;
  nome: string;
  telefone: string;
  ponto_embarque?: string;
  num_voo?: string;
  hotel?: string;
  num_voo_ida?: string;
  num_voo_volta?: string;
  adultos: number;
  criancas?: number;
  cadeirinha?: number;
  elevacao?: number;
  bagagens_23kg?: number;
  bagagens_10kg?: number;
  bolsas?: number;
  item_volumoso?: boolean;
  item_volumoso_desc?: string;
  roteiro?: string;
  mobilidade_reduzida?: boolean;
  mobilidade_reduzida_desc?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

// ──────────── LEADS ────────────

export type LeadStatus = 'novo' | 'respondido' | 'agendado';
export type LeadServico = 'transfer_aeroporto' | 'city_tour' | 'vinicola' | 'passeio' | 'outro';

export interface Lead {
  id?: string;
  nome: string;
  telefone: string;
  email?: string;
  data_desejada?: string;
  destino?: string;
  servico?: LeadServico;
  mensagem?: string;
  status: LeadStatus;
  created_at: string;
  updated_at?: string;
}

// ──────────── SOLICITAÇÕES E AVALIAÇÕES ────────────

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type RequestType = 'driver' | 'trip';

export interface Request {
  id?: string;
  type: RequestType;
  reference_id: string;
  owner_id: string;
  owner_name?: string;
  requester_id: string;
  requester_name: string;
  requester_phone: string;
  status: RequestStatus;
  message?: string;
  // Dados da rota desnormalizados para exibição em MinhasSolicitacoes
  origin?: string;
  destination?: string;
  departure_date?: string;
  departure_time?: string;
  created_at: string;
  updated_at?: string;
}

export interface Rating {
  id?: string;
  request_id: string;
  rater_id: string;
  rater_name?: string;
  rated_user_id: string;
  score: number;              // 1–5
  comment?: string;
  created_at: string;
}

// ──────────── FINANCEIRO ────────────

export interface DashboardKpis {
  receitaBruta: number;
  totalGastos: number;
  lucroLiquido: number;
  kmRodados: number;
  percentGastos: number;
  ganhoPorKm: number;
  custoPorKm: number;
  lucroporKm: number;
  gastosPorCategoria: { categoria: string; valor: number; percentual: number }[];
  receitaPorApp: {
    nome: string;
    valor: number;
    percentual: number;
    qtdCorridas: number;
    receitaMedia: number;
    isApp: boolean;
  }[];
  totalCorridas: number;
  receitaMediaPorCorrida: number;
}
