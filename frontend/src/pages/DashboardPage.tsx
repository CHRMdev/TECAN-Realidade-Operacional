import { useState, useEffect } from 'react';
import { Layers, Package, PackageOpen, Truck, FileText, Download } from 'lucide-react';
import { getSummary } from '../api/dashboard';
import { downloadExcel, downloadPdf } from '../api/export';
import type { DashboardSummaryData } from '../types';
import { KpiCard } from '../components/ui/KpiCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { BarChartDiario } from '../components/charts/BarChartDiario';
import { DonutTurnos } from '../components/charts/DonutTurnos';
import { useToast } from '../components/ui/Toast';

function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export function DashboardPage() {
  const { toast } = useToast();
  const [from, setFrom] = useState(getMonthRange().from);
  const [to, setTo] = useState(getMonthRange().to);
  const [filterFrom, setFilterFrom] = useState(from);
  const [filterTo, setFilterTo] = useState(to);

  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  async function fetchData(f: string, t: string) {
    setLoading(true);
    try {
      const res = await getSummary(f, t);
      setData(res);
    } catch {
      toast({ type: 'error', title: 'Erro ao carregar dashboard' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(filterFrom, filterTo);
  }, []);

  function handleFilter() {
    setFilterFrom(from);
    setFilterTo(to);
    fetchData(from, to);
  }

  async function handleExport(type: 'excel' | 'pdf') {
    setExporting(type);
    try {
      if (type === 'excel') await downloadExcel(filterFrom, filterTo);
      else await downloadPdf(filterFrom, filterTo);
      setExportOpen(false);
    } catch {
      toast({ type: 'error', title: 'Erro ao exportar relatório' });
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Filtro de período */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">De</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Até</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <Button onClick={handleFilter} loading={loading}>Filtrar</Button>
        <div className="ml-auto">
          <Button variant="secondary" onClick={() => setExportOpen(true)}>
            <Download size={16} />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard label="Lâminas Produzidas" value={data.summary.totalLaminas} icon={Layers} color="text-blue-400" delay={0} />
            <KpiCard label="Lâminas Entregues" value={data.summary.laminasEntregues} icon={Package} color="text-green-400" delay={0.05} />
            <KpiCard label="Desembarcadas" value={data.summary.totalQuebras} icon={PackageOpen} color="text-orange-400" delay={0.1} />
            <KpiCard label="Total Entregas" value={data.summary.totalEntregas} icon={Truck} color="text-purple-400" delay={0.15} />
            <KpiCard label="AWBs Entregues" value={data.summary.totalAWBs} icon={FileText} color="text-cyan-400" delay={0.2} />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Atividade por Dia</h3>
              <BarChartDiario data={data.byDay} />
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Lâminas por Turno</h3>
              <DonutTurnos data={data.byShift} />
            </div>
          </div>
        </>
      ) : null}

      {/* Modal Exportar */}
      <Modal open={exportOpen} onOpenChange={setExportOpen} title="Exportar Relatório">
        <p className="text-sm text-slate-400 mb-4">
          Período: <span className="text-slate-200">{filterFrom}</span> a{' '}
          <span className="text-slate-200">{filterTo}</span>
        </p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => handleExport('excel')}
            loading={exporting === 'excel'}
            size="lg"
            className="w-full"
          >
            Exportar Excel (.xlsx)
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            loading={exporting === 'pdf'}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Exportar PDF
          </Button>
        </div>
      </Modal>
    </div>
  );
}
