import { useState, useEffect } from 'react';
import { Layers, Package, PackageOpen, Truck, FileText, Download, Scale, Calendar, TrendingUp, PlaneTakeoff } from 'lucide-react';
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

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#0d1a30',
  border: '1.5px solid #1e3355',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#e2eafc',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#4a6485',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

const sectionLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#4a6485',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '12px',
};

const chartCardStyle: React.CSSProperties = {
  backgroundColor: '#111e35',
  border: '1px solid #1e3355',
  borderRadius: '14px',
  padding: '20px',
};

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

  useEffect(() => { fetchData(filterFrom, filterTo); }, []);

  function handleFilter() {
    setFilterFrom(from); setFilterTo(to); fetchData(from, to);
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Barra de filtro */}
      <div style={{
        backgroundColor: '#111e35',
        border: '1px solid #1e3355',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4a6485', marginRight: '4px' }}>
          <Calendar size={15} />
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Período
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>De</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e3355')} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>Até</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e3355')} />
        </div>

        <Button onClick={handleFilter} loading={loading}>Aplicar</Button>

        {/* Period badge */}
        {!loading && (
          <div style={{
            marginLeft: '4px',
            padding: '6px 12px',
            backgroundColor: '#1a78d415',
            border: '1px solid #1a78d430',
            borderRadius: '8px',
            color: '#5a9fd4',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {formatDateBR(filterFrom)} — {formatDateBR(filterTo)}
          </div>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <Button variant="secondary" onClick={() => setExportOpen(true)}>
            <Download size={14} /> Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Spinner className="h-8 w-8" />
        </div>
      ) : data ? (
        <>
          {/* KPIs */}
          <div>
            <div style={sectionLabelStyle}>
              <TrendingUp size={13} />
              Indicadores do período
            </div>
            {/* overflow-x permite scroll em telas menores sem quebrar o layout */}
            <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
              <div style={{
                display: 'grid',
                /* minmax(0, 1fr) suprime o min-content implícito do 1fr,
                   garantindo compressão real. minWidth força 7 colunas visíveis
                   mesmo em viewports estreitas (scroll horizontal como fallback). */
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: '10px',
                minWidth: '840px',
              }}>
                <KpiCard label="Lâminas Produzidas" value={data.summary.totalLaminas} icon={Layers} accentColor="#1a78d4" delay={0} />
                <KpiCard label="Lâminas Entregues" value={data.summary.laminasEntregues} icon={Package} accentColor="#10b981" delay={0.05} />
                <KpiCard label="Desembarcadas" value={data.summary.totalQuebras} icon={PackageOpen} accentColor="#e07050" delay={0.1} />
                <KpiCard label="Total Entregas" value={data.summary.totalEntregas} icon={Truck} accentColor="#f59e0b" delay={0.15} />
                <KpiCard label="AWBs Entregues" value={data.summary.totalAWBs} icon={FileText} accentColor="#6b9e8f" delay={0.2} />
                <KpiCard label="Saídas de Voo" value={data.summary.totalSaidas} icon={PlaneTakeoff} accentColor="#a78bfa" delay={0.25} />
                <KpiCard
                  label="Peso Movimentado"
                  value={Math.round(data.summary.totalPesoKg)}
                  icon={Scale}
                  accentColor="#8b5cf6"
                  delay={0.3}
                  suffix="kg"
                />
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div style={chartCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <p style={{ color: '#e2eafc', fontSize: '14px', fontWeight: 700, margin: 0 }}>Atividade por Dia</p>
                  <p style={{ color: '#4a6485', fontSize: '11px', margin: '3px 0 0' }}>Lâminas, quebras, entregas e AWBs</p>
                </div>
                <div style={{ width: '3px', height: '28px', borderRadius: '2px', backgroundColor: '#1a78d4' }} />
              </div>
              <BarChartDiario data={data.byDay} />
            </div>

            <div style={chartCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <p style={{ color: '#e2eafc', fontSize: '14px', fontWeight: 700, margin: 0 }}>Lâminas por Turno</p>
                  <p style={{ color: '#4a6485', fontSize: '11px', margin: '3px 0 0' }}>Distribuição A / B / C</p>
                </div>
                <div style={{ width: '3px', height: '28px', borderRadius: '2px', backgroundColor: '#e07050' }} />
              </div>
              <DonutTurnos data={data.byShift} />
            </div>
          </div>
        </>
      ) : null}

      <Modal open={exportOpen} onOpenChange={setExportOpen} title="Exportar Relatório" description={`Período: ${formatDateBR(filterFrom)} a ${formatDateBR(filterTo)}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button onClick={() => handleExport('excel')} loading={exporting === 'excel'} size="lg" style={{ width: '100%' }}>
            Exportar Excel (.xlsx)
          </Button>
          <Button onClick={() => handleExport('pdf')} loading={exporting === 'pdf'} variant="secondary" size="lg" style={{ width: '100%' }}>
            Exportar PDF
          </Button>
        </div>
      </Modal>
    </div>
  );
}
