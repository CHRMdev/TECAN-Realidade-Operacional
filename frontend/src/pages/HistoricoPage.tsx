import { useState, useEffect, useCallback } from 'react';
import { getHistorico } from '../api/historico';
import type { HistoricoItem, HistoricoResponse } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

const TYPE_LABELS: Record<string, string> = {
  quebra: 'Desembarque',
  entrega: 'Retira',
  lamina: 'Produção',
  saida_voo: 'Volumetria',
  peso: 'Peso (legado)',
  contingente: 'Contingente',
};
const TYPE_BADGE: Record<string, 'warning' | 'success' | 'info' | 'sage' | 'default'> = {
  quebra: 'warning', entrega: 'success', lamina: 'info', saida_voo: 'sage', peso: 'default', contingente: 'info',
};
const SHIFT_BADGE: Record<string, 'info' | 'success' | 'warning'> = {
  A: 'info', B: 'success', C: 'warning',
};

function getDetail(item: HistoricoItem): string {
  const d = item.data as Record<string, unknown>;
  if (item.type === 'quebra') return `Voo ${d.flightNumber} | ULD ${d.uldNumber}`;
  if (item.type === 'entrega') {
    const awbs = (d.awbs as Array<{ awbNumber: string }> | undefined) ?? [];
    return `${d.deliveryType}${d.uldNumber ? ` | ULD ${d.uldNumber}` : ''} | ${awbs.length} AWB(s)`;
  }
  if (item.type === 'lamina') return `ULD ${d.uldNumber} | Cliente: ${d.clientName}`;
  if (item.type === 'saida_voo') {
    const peso = d.pesoKg as number | null | undefined;
    return `Voo ${d.flightNumber}${peso ? ` | ${peso} kg` : ''}`;
  }
  if (item.type === 'peso') return `${d.pesoKg} kg`;
  if (item.type === 'contingente') return `${d.quantidadeTripulantes} tripulante(s)`;
  return '';
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#111e35',
  border: '1px solid #1e3355',
  borderRadius: '12px',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: '#0d1a30',
  border: '1.5px solid #1e3355',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#e2eafc',
  outline: 'none',
};

const TYPES = [
  { value: '', label: 'Todos' },
  { value: 'quebra', label: 'Desembarque' },
  { value: 'entrega', label: 'Retira' },
  { value: 'lamina', label: 'Produção' },
  { value: 'saida_voo', label: 'Volumetria' },
  { value: 'contingente', label: 'Contingente' },
  { value: 'peso', label: 'Peso (legado)' },
];

export function HistoricoPage() {
  const { toast } = useToast();
  const { from: initFrom, to: initTo } = getMonthRange();
  const [typeFilter, setTypeFilter] = useState('');
  const [from, setFrom] = useState(initFrom);
  const [to, setTo] = useState(initTo);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<HistoricoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: number, type: string, f: string, t: string) => {
    setLoading(true);
    try {
      const res = await getHistorico({ page: p, limit: 20, type: type || undefined, from: f, to: t });
      setResult(res);
    } catch (err) {
      console.error('Histórico error:', err);
      toast({ type: 'error', title: 'Erro ao carregar histórico' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(1, '', initFrom, initTo); }, []);

  function handleFilter() { setPage(1); fetchData(1, typeFilter, from, to); }
  function handlePage(p: number) { setPage(p); fetchData(p, typeFilter, from, to); }

  const pagination = result?.pagination;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filtros */}
      <div style={{ ...cardStyle, padding: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a6485', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tipo
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ ...inputStyle, paddingRight: '32px', appearance: 'none', cursor: 'pointer', minWidth: '140px' }}
            >
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#4a6485', pointerEvents: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a6485', textTransform: 'uppercase', letterSpacing: '0.05em' }}>De</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e3355')} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a6485', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Até</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e3355')} />
        </div>
        <Button onClick={handleFilter} loading={loading}>Filtrar</Button>
      </div>

      {/* Tabela */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <Spinner className="h-8 w-8" />
          </div>
        ) : !result?.data.length ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', color: '#4a6485', fontSize: '14px' }}>
            Nenhum registro encontrado
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e3355' }}>
                {['Tipo', 'Turno', 'Detalhes', 'Data/Hora'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#4a6485', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.map((item, i) => {
                const shift = (item.data as Record<string, unknown>).shift as string;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #162040', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#162040')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge variant={TYPE_BADGE[item.type] ?? 'default'}>{TYPE_LABELS[item.type] ?? item.type}</Badge>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {shift && <Badge variant={SHIFT_BADGE[shift] ?? 'default'}>Turno {shift}</Badge>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#7a9bc4' }}>{getDetail(item)}</td>
                    <td style={{ padding: '12px 16px', color: '#4a6485', whiteSpace: 'nowrap' }}>
                      {new Date(item.createdAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#4a6485' }}>
          <span>Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => handlePage(page - 1)}>
              <ChevronLeft size={14} /> Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={page === pagination.totalPages} onClick={() => handlePage(page + 1)}>
              Próximo <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
