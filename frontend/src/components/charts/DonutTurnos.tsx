import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DashboardSummaryData } from '../../types';

type ByShiftRow = DashboardSummaryData['byShift'][number];

interface Props {
  data: DashboardSummaryData['byShift'];
  valueKey: keyof ByShiftRow;
  centerLabel: string;
  unitLabel?: string;
  colors?: [string, string, string];
}

const DEFAULT_COLORS: [string, string, string] = ['#1a78d4', '#e07050', '#f59e0b'];
const SHIFT_LABELS = ['Turno A', 'Turno B', 'Turno C'];

function makeTooltip(unitLabel: string) {
  return function CustomTooltip({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: { percent: number } }>;
  }) {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
      <div style={{
        backgroundColor: '#0d1a30',
        border: '1px solid #1e3355',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}>
        <p style={{ color: '#7a9bc4', fontSize: '12px', fontWeight: 600, margin: '0 0 4px' }}>{item.name}</p>
        <p style={{ color: '#e2eafc', fontSize: '14px', fontWeight: 800, margin: 0 }}>
          {item.value} <span style={{ color: '#4a6485', fontSize: '12px', fontWeight: 500 }}>{unitLabel}</span>
        </p>
        <p style={{ color: '#4a6485', fontSize: '11px', margin: '2px 0 0' }}>
          {(item.payload.percent * 100).toFixed(1)}% do total
        </p>
      </div>
    );
  };
}

function makeCenterLabel(total: number, centerLabel: string) {
  return function CenterLabel({ cx, cy }: { cx: number; cy: number }) {
    return (
      <g>
        <text x={cx} y={cy - 8} textAnchor="middle" style={{ fill: '#e2eafc', fontSize: '26px', fontWeight: 800 }}>
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" style={{ fill: '#4a6485', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {centerLabel}
        </text>
      </g>
    );
  };
}

export function DonutTurnos({ data, valueKey, centerLabel, unitLabel, colors }: Props) {
  const palette = colors ?? DEFAULT_COLORS;
  const tooltipUnit = (unitLabel ?? centerLabel).toLowerCase();

  const chartData = data.map((d, i) => ({
    name: SHIFT_LABELS[i] ?? `Turno ${d.shift}`,
    value: Number(d[valueKey] ?? 0),
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#4a6485', fontSize: '13px' }}>
        Sem dados no período
      </div>
    );
  }

  const Tip = makeTooltip(tooltipUnit);
  const Center = makeCenterLabel(total, centerLabel);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={62}
          outerRadius={88}
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={({ cx, cy }) => <Center cx={cx} cy={cy} />}
        >
          {chartData.map((_, i) => (
            <Cell
              key={i}
              fill={palette[i % palette.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip content={<Tip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ color: '#4a6485', fontSize: 12, paddingTop: '8px' }}
          formatter={(value) => <span style={{ color: '#7a9bc4' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
