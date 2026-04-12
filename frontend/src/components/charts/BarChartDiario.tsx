import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardSummaryData } from '../../types';

interface Props {
  data: DashboardSummaryData['byDay'];
}

// Ordem idêntica à sequência dos KPI cards
const BAR_SERIES = [
  { key: 'laminas',          name: 'Lâminas Prod.',  color: '#1a78d4' },
  { key: 'laminasEntregues', name: 'Lâm. Entregues', color: '#10b981' },
  { key: 'quebras',          name: 'Desembarcadas',   color: '#e07050' },
  { key: 'entregas',         name: 'Entregas',         color: '#f59e0b' },
  { key: 'awbs',             name: 'AWBs',             color: '#6b9e8f' },
  { key: 'saidas',           name: 'Saídas de Voo',  color: '#a78bfa' },
] as const;

const PESO_COLOR = '#8b5cf6';

// Legenda customizada — renderiza na ordem exata (não alfabética)
function CustomLegend() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '14px', alignItems: 'center' }}>
      {BAR_SERIES.map((s) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: s.color, flexShrink: 0 }} />
          <span style={{ color: '#4a6485', fontSize: '11px' }}>{s.name}</span>
        </div>
      ))}
      {/* Peso: linha tracejada */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{ width: '16px', height: '2px', borderTop: `2px dashed ${PESO_COLOR}`, flexShrink: 0 }} />
        <span style={{ color: '#4a6485', fontSize: '11px' }}>Peso (kg) →</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  const bars = BAR_SERIES.map((s) => {
    const entry = payload.find((p) => p.dataKey === s.key);
    return entry && entry.value > 0 ? { ...s, value: entry.value } : null;
  }).filter(Boolean) as Array<{ key: string; name: string; color: string; value: number }>;

  const pesoEntry = payload.find((p) => p.dataKey === 'pesoKg');

  return (
    <div style={{
      backgroundColor: '#0d1a30',
      border: '1px solid #1e3355',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      minWidth: '170px',
    }}>
      <p style={{ color: '#5a7aa5', fontSize: '11px', fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      {bars.map((s) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '2px', backgroundColor: s.color, flexShrink: 0 }} />
          <span style={{ color: '#7a9bc4', fontSize: '11px', flex: 1 }}>{s.name}</span>
          <span style={{ color: '#e2eafc', fontSize: '12px', fontWeight: 700 }}>{s.value}</span>
        </div>
      ))}
      {pesoEntry && pesoEntry.value > 0 && (
        <>
          <div style={{ borderTop: '1px solid #1e3355', margin: '6px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: PESO_COLOR, flexShrink: 0 }} />
            <span style={{ color: '#7a9bc4', fontSize: '11px', flex: 1 }}>Peso</span>
            <span style={{ color: '#e2eafc', fontSize: '12px', fontWeight: 700 }}>{pesoEntry.value.toLocaleString('pt-BR')} kg</span>
          </div>
        </>
      )}
    </div>
  );
};

export function BarChartDiario({ data }: Props) {
  const formatted = data.map((d) => ({ ...d, dia: d.day.slice(5) }));

  if (!data.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#4a6485', fontSize: '13px' }}>
        Nenhum dado no período
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={formatted} margin={{ top: 4, right: 48, left: -20, bottom: 0 }} barCategoryGap="28%" barGap={1}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3355" vertical={false} />

          {/* Eixo esquerdo: contagens */}
          <YAxis
            yAxisId="left"
            tick={{ fill: '#4a6485', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={28}
          />

          {/* Eixo direito: kg (escala independente) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: `${PESO_COLOR}99`, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={40}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}`}
          />

          <XAxis
            dataKey="dia"
            tick={{ fill: '#4a6485', fontSize: 11 }}
            axisLine={{ stroke: '#1e3355' }}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />

          {/* Barras — mesma ordem dos KPI cards */}
          {BAR_SERIES.map((s) => (
            <Bar
              key={s.key}
              yAxisId="left"
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              radius={[3, 3, 0, 0]}
              maxBarSize={10}
            />
          ))}

          {/* Peso como linha tracejada no eixo direito */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="pesoKg"
            name="Peso (kg)"
            stroke={PESO_COLOR}
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3, fill: PESO_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: PESO_COLOR }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  );
}
