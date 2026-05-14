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
  { key: 'quebras',          name: 'Desembarque',     color: '#e07050' },
  { key: 'entregas',         name: 'Retiras',         color: '#f59e0b' },
  { key: 'awbs',             name: 'AWBs',            color: '#6b9e8f' },
  { key: 'laminas',          name: 'ULDs/Carts',      color: '#1a78d4' },
  { key: 'saidasProduzidas', name: 'Vôos Produzidos', color: '#a78bfa' },
  { key: 'saidasRecebidas',  name: 'Vôos Recebidos',  color: '#38bdf8' },
] as const;

const PESO_COLOR = '#8b5cf6';
const CONTINGENTE_COLOR = '#10b981';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{ width: '16px', height: '2px', borderTop: `2px dashed ${PESO_COLOR}`, flexShrink: 0 }} />
        <span style={{ color: '#4a6485', fontSize: '11px' }}>Peso (kg) →</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{ width: '16px', height: '2px', borderTop: `2px dotted ${CONTINGENTE_COLOR}`, flexShrink: 0 }} />
        <span style={{ color: '#4a6485', fontSize: '11px' }}>Contingente →</span>
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
  const contingEntry = payload.find((p) => p.dataKey === 'contingente');

  return (
    <div style={{
      backgroundColor: '#0d1a30',
      border: '1px solid #1e3355',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      minWidth: '180px',
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
      {(pesoEntry?.value || contingEntry?.value) && (
        <div style={{ borderTop: '1px solid #1e3355', margin: '6px 0' }} />
      )}
      {pesoEntry && pesoEntry.value > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: PESO_COLOR, flexShrink: 0 }} />
          <span style={{ color: '#7a9bc4', fontSize: '11px', flex: 1 }}>Peso</span>
          <span style={{ color: '#e2eafc', fontSize: '12px', fontWeight: 700 }}>{pesoEntry.value.toLocaleString('pt-BR')} kg</span>
        </div>
      )}
      {contingEntry && contingEntry.value > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: CONTINGENTE_COLOR, flexShrink: 0 }} />
          <span style={{ color: '#7a9bc4', fontSize: '11px', flex: 1 }}>Contingente</span>
          <span style={{ color: '#e2eafc', fontSize: '12px', fontWeight: 700 }}>{contingEntry.value} trip.</span>
        </div>
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
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={formatted} margin={{ top: 4, right: 56, left: -20, bottom: 0 }} barCategoryGap="22%" barGap={1}>
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

          {/* Eixo direito: kg / tripulantes (escala independente) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: `${PESO_COLOR}99`, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={44}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}`}
          />

          <XAxis
            dataKey="dia"
            tick={{ fill: '#4a6485', fontSize: 11 }}
            axisLine={{ stroke: '#1e3355' }}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />

          {/* Barras */}
          {BAR_SERIES.map((s) => (
            <Bar
              key={s.key}
              yAxisId="left"
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              radius={[3, 3, 0, 0]}
              maxBarSize={9}
            />
          ))}

          {/* Peso — linha tracejada no eixo direito */}
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

          {/* Contingente — linha pontilhada no eixo direito */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="contingente"
            name="Contingente"
            stroke={CONTINGENTE_COLOR}
            strokeWidth={2}
            strokeDasharray="2 4"
            dot={{ r: 3, fill: CONTINGENTE_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CONTINGENTE_COLOR }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  );
}
