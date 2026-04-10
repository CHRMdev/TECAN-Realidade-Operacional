import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DashboardSummaryData } from '../../types';

interface Props {
  data: DashboardSummaryData['byShift'];
}

const COLORS = ['#3b82f6', '#22c55e', '#f97316'];

export function DonutTurnos({ data }: Props) {
  const chartData = data.map((d) => ({
    name: `Turno ${d.shift}`,
    value: d.laminas,
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        Sem lâminas produzidas no período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#f1f5f9' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
