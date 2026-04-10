import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardSummaryData } from '../../types';

interface Props {
  data: DashboardSummaryData['byDay'];
}

export function BarChartDiario({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    dia: d.day.slice(5), // MM-DD
  }));

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        Nenhum dado no período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="dia" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#f1f5f9' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Bar dataKey="laminas" name="Lâminas Prod." fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="quebras" name="Desembarcadas" fill="#f97316" radius={[4, 4, 0, 0]} />
        <Bar dataKey="entregas" name="Entregas" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="awbs" name="AWBs" fill="#a855f7" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
