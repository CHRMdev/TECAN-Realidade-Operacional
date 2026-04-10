import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

export async function getDashboardSummary(
  prisma: PrismaClient,
  from: string,
  to: string
) {
  const fromDate = new Date(from + 'T00:00:00.000Z');
  const toDate = new Date(to + 'T23:59:59.999Z');
  const where = { createdAt: { gte: fromDate, lte: toDate } };

  const [quebras, entregas, laminas, saidas] = await Promise.all([
    prisma.quebra.findMany({ where, include: { user: { select: { username: true, firstName: true, lastName: true } } } }),
    prisma.entrega.findMany({ where, include: { awbs: true, user: { select: { username: true, firstName: true, lastName: true } } } }),
    prisma.laminaProduzida.findMany({ where, include: { user: { select: { username: true, firstName: true, lastName: true } } } }),
    prisma.saidaVoo.findMany({ where, include: { user: { select: { username: true, firstName: true, lastName: true } } } }),
  ]);

  const totalAWBs = entregas.reduce((sum, e) => sum + e.awbs.length, 0);
  const laminasEntregues = entregas.filter((e) => e.deliveryType === 'LAMINA').length;

  // byShift
  const shifts = ['A', 'B', 'C'];
  const byShift = shifts.map((shift) => ({
    shift,
    quebras: quebras.filter((q) => q.shift === shift).length,
    entregas: entregas.filter((e) => e.shift === shift).length,
    awbs: entregas.filter((e) => e.shift === shift).reduce((sum, e) => sum + e.awbs.length, 0),
    laminas: laminas.filter((l) => l.shift === shift).length,
    saidas: saidas.filter((s) => s.shift === shift).length,
  }));

  // byDay
  const allDates = new Set([
    ...quebras.map((q) => format(q.createdAt, 'yyyy-MM-dd')),
    ...entregas.map((e) => format(e.createdAt, 'yyyy-MM-dd')),
    ...laminas.map((l) => format(l.createdAt, 'yyyy-MM-dd')),
    ...saidas.map((s) => format(s.createdAt, 'yyyy-MM-dd')),
  ]);

  const byDay = Array.from(allDates).sort().map((day) => ({
    day,
    quebras: quebras.filter((q) => format(q.createdAt, 'yyyy-MM-dd') === day).length,
    entregas: entregas.filter((e) => format(e.createdAt, 'yyyy-MM-dd') === day).length,
    awbs: entregas.filter((e) => format(e.createdAt, 'yyyy-MM-dd') === day).reduce((sum, e) => sum + e.awbs.length, 0),
    laminas: laminas.filter((l) => format(l.createdAt, 'yyyy-MM-dd') === day).length,
    saidas: saidas.filter((s) => format(s.createdAt, 'yyyy-MM-dd') === day).length,
  }));

  return {
    summary: {
      totalQuebras: quebras.length,
      totalEntregas: entregas.length,
      laminasEntregues,
      totalAWBs,
      totalLaminas: laminas.length,
      totalSaidas: saidas.length,
    },
    byShift,
    byDay,
  };
}
