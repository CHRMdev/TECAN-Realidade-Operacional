export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  createdAt?: string;
}

export interface Quebra {
  id: string;
  userId: string;
  shift: string;
  flightNumber: string;
  uldNumber: string;
  createdAt: string;
}

export interface AWBItem {
  id: string;
  entregaId: string;
  awbNumber: string;
}

export interface Entrega {
  id: string;
  userId: string;
  shift: string;
  deliveryType: 'VOLUME' | 'LAMINA';
  uldNumber?: string | null;
  awbs: AWBItem[];
  createdAt: string;
}

export interface LaminaProduzida {
  id: string;
  userId: string;
  shift: string;
  uldNumber: string;
  clientName: string;
  createdAt: string;
}

export interface SaidaVoo {
  id: string;
  userId: string;
  shift: string;
  flightNumber: string;
  createdAt: string;
}

export interface DashboardSummaryData {
  summary: {
    totalQuebras: number;
    totalEntregas: number;
    laminasEntregues: number;
    totalAWBs: number;
    totalLaminas: number;
    totalSaidas: number;
  };
  byShift: Array<{
    shift: string;
    quebras: number;
    entregas: number;
    awbs: number;
    laminas: number;
    saidas: number;
  }>;
  byDay: Array<{
    day: string;
    quebras: number;
    entregas: number;
    awbs: number;
    laminas: number;
    saidas: number;
  }>;
}

export interface HistoricoItem {
  type: 'quebra' | 'entrega' | 'lamina' | 'saida_voo';
  createdAt: string;
  data: Record<string, unknown>;
}

export interface HistoricoResponse {
  success: boolean;
  data: HistoricoItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
