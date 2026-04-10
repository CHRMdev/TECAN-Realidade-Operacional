import { useState, useEffect, useCallback } from 'react';
import { getHistorico } from '../api/historico';
import type { HistoricoItem, HistoricoResponse } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

const TYPE_LABELS: Record<string, string> = {
  quebra: 'Quebra',
  entrega: 'Entrega',
  lamina: 'Lâmina',
  saida_voo: 'Saída de Voo',
};

const TYPE_BADGE: Record<string, 'orange' | 'green' | 'blue' | 'purple'> = {
  quebra: 'orange',
  entrega: 'green',
  lamina: 'blue',
  saida_voo: 'purple',
};

const SHIFT_BADGE: Record<string, 'blue' | 'green' | 'orange'> = {
  A: 'blue',
  B: 'green',
  C: 'orange',
};

function getDetail(item: HistoricoItem): string {
  const d = item.data as Record<string, unknown>;
  if (item.type === 'quebra') return `Voo ${d.flightNumber} | ULD ${d.uldNumber}`;
  if (item.type === 'entrega') {
    const awbs = (d.awbs as Array<{ awbNumber: string }> | undefined) ?? [];
    return `${d.deliveryType}${d.uldNumber ? ` | ULD ${d.uldNumber}` : ''} | ${awbs.length} AWB(s)`;
  }
  if (item.type === 'lamina') return `ULD ${d.uldNumber} | Cliente: ${d.clientName}`;
  if (item.type === 'saida_voo') return `Voo ${d.flightNumber}`;
  return '';
}

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
    } catch {
      toast({ type: 'error', title: 'Erro ao carregar histórico' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData(1, '', initFrom, initTo);
  }, []);

  function handleFilter() {
    setPage(1);
    fetchData(1, typeFilter, from, to);
  }

  function handlePage(p: number) {
    setPage(p);
    fetchData(p, typeFilter, from, to);
  }

  const pagination = result?.pagination;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Tipo</label>
          <Select.Root value={typeFilter} onValueChange={setTypeFilter}>
            <Select.Trigger className="flex items-center justify-between gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors cursor-pointer w-40">
              <Select.Value placeholder="Todos" />
              <Select.Icon><ChevronDown size={14} className="text-slate-400" /></Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <Select.Viewport>
                  {['', 'quebra', 'entrega', 'lamina', 'saida_voo'].map((val) => (
                    <Select.Item key={val} value={val} className="px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 cursor-pointer outline-none">
                      <Select.ItemText>{val ? TYPE_LABELS[val] : 'Todos'}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">De</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Até</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors" />
        </div>
        <Button onClick={handleFilter} loading={loading}>Filtrar</Button>
      </div>

      {/* Tabela */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner className="h-8 w-8" /></div>
        ) : !result?.data.length ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm">Nenhum registro encontrado</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Turno</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Detalhes</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((item, i) => {
                const shift = (item.data as Record<string, unknown>).shift as string;
                return (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant={TYPE_BADGE[item.type] ?? 'slate'}>{TYPE_LABELS[item.type] ?? item.type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {shift && <Badge variant={SHIFT_BADGE[shift] ?? 'slate'}>Turno {shift}</Badge>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{getDetail(item)}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
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
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => handlePage(page - 1)}>
              <ChevronLeft size={16} /> Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={page === pagination.totalPages} onClick={() => handlePage(page + 1)}>
              Próximo <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
