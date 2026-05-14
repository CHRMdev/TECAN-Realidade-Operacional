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
  const diaWhere = { dia: { gte: fromDate, lte: toDate } };

  const [quebras, entregas, laminas, saidas, pesos, contingentes] = await Promise.all([
    prisma.quebra.findMany({ where, include: { user: { select: { username: true, firstName: true, lastName: true } } } }),
    prisma.entrega.findMany({ where, include: { awbs: true, user: { select: { username: true, firstName: true, lastName: true } } } }),
    prisma.laminaProduzida.findMany({ where, include: { user: { select: { username: true, firstName: true, lastName: true } } } }),
    prisma.saidaVoo.findMany({ where, include: { user: { select: { username: true, firstName: true, lastName: true } } } }),
    prisma.pesoMovimentado.findMany({ where }),
    prisma.contingente.findMany({ where: diaWhere, orderBy: [{ dia: 'asc' }, { shift: 'asc' }] }),
  ]);

  const totalAWBs = entregas.reduce((sum, e) => sum + e.awbs.length, 0);
  const laminasEntregues = entregas.filter((e) => e.deliveryType === 'LAMINA').length;
  const totalPesoLegacy = pesos.reduce((sum, p) => sum + p.pesoKg, 0);
  const totalPesoVoos = saidas.reduce((sum, s) => sum + (s.pesoKg ?? 0), 0);
  const totalVolumetriaKg = totalPesoLegacy + totalPesoVoos;
  const totalContingente = contingentes.reduce((sum, c) => sum + c.quantidadeTripulantes, 0);

  const isSaida = (s: { direction?: string | null }) => (s.direction ?? 'SAIDA') === 'SAIDA';
  const isChegada = (s: { direction?: string | null }) => s.direction === 'CHEGADA';

  const saidasProduzidas = saidas.filter(isSaida);
  const saidasRecebidas = saidas.filter(isChegada);

  // byShift
  const shifts = ['A', 'B', 'C'];
  const byShift = shifts.map((shift) => ({
    shift,
    quebras: quebras.filter((q) => q.shift === shift).length,
    entregas: entregas.filter((e) => e.shift === shift).length,
    awbs: entregas.filter((e) => e.shift === shift).reduce((sum, e) => sum + e.awbs.length, 0),
    laminas: laminas.filter((l) => l.shift === shift).length,
    saidas: saidas.filter((s) => s.shift === shift).length,
    saidasProduzidas: saidasProduzidas.filter((s) => s.shift === shift).length,
    saidasRecebidas: saidasRecebidas.filter((s) => s.shift === shift).length,
    pesoKg:
      pesos.filter((p) => p.shift === shift).reduce((sum, p) => sum + p.pesoKg, 0) +
      saidas.filter((s) => s.shift === shift).reduce((sum, s) => sum + (s.pesoKg ?? 0), 0),
    tripulantes: contingentes.filter((c) => c.shift === shift).reduce((sum, c) => sum + c.quantidadeTripulantes, 0),
  }));

  // byDay
  const allDates = new Set([
    ...quebras.map((q) => format(q.createdAt, 'yyyy-MM-dd')),
    ...entregas.map((e) => format(e.createdAt, 'yyyy-MM-dd')),
    ...laminas.map((l) => format(l.createdAt, 'yyyy-MM-dd')),
    ...saidas.map((s) => format(s.createdAt, 'yyyy-MM-dd')),
    ...pesos.map((p) => format(p.createdAt, 'yyyy-MM-dd')),
    ...contingentes.map((c) => format(c.dia, 'yyyy-MM-dd')),
  ]);

  const byDay = Array.from(allDates).sort().map((day) => {
    const contingDay = contingentes.filter((c) => format(c.dia, 'yyyy-MM-dd') === day)
      .reduce((sum, c) => sum + c.quantidadeTripulantes, 0);
    return {
      day,
      laminas: laminas.filter((l) => format(l.createdAt, 'yyyy-MM-dd') === day).length,
      laminasEntregues: entregas.filter((e) => format(e.createdAt, 'yyyy-MM-dd') === day && e.deliveryType === 'LAMINA').length,
      quebras: quebras.filter((q) => format(q.createdAt, 'yyyy-MM-dd') === day).length,
      entregas: entregas.filter((e) => format(e.createdAt, 'yyyy-MM-dd') === day).length,
      awbs: entregas.filter((e) => format(e.createdAt, 'yyyy-MM-dd') === day).reduce((sum, e) => sum + e.awbs.length, 0),
      saidas: saidas.filter((s) => format(s.createdAt, 'yyyy-MM-dd') === day).length,
      saidasProduzidas: saidasProduzidas.filter((s) => format(s.createdAt, 'yyyy-MM-dd') === day).length,
      saidasRecebidas: saidasRecebidas.filter((s) => format(s.createdAt, 'yyyy-MM-dd') === day).length,
      pesoKg:
        pesos.filter((p) => format(p.createdAt, 'yyyy-MM-dd') === day).reduce((sum, p) => sum + p.pesoKg, 0) +
        saidas.filter((s) => format(s.createdAt, 'yyyy-MM-dd') === day).reduce((sum, s) => sum + (s.pesoKg ?? 0), 0),
      contingente: contingDay,
    };
  });

  const contingenteByDay = Array.from(
    contingentes.reduce<Map<string, { day: string; A: number; B: number; C: number }>>((acc, c) => {
      const day = format(c.dia, 'yyyy-MM-dd');
      if (!acc.has(day)) acc.set(day, { day, A: 0, B: 0, C: 0 });
      const entry = acc.get(day)!;
      if (c.shift === 'A' || c.shift === 'B' || c.shift === 'C') {
        entry[c.shift] = c.quantidadeTripulantes;
      }
      return acc;
    }, new Map()).values()
  ).sort((a, b) => a.day.localeCompare(b.day));

  return {
    summary: {
      totalQuebras: quebras.length,
      totalEntregas: entregas.length,
      laminasEntregues,
      totalAWBs,
      totalLaminas: laminas.length,
      totalSaidas: saidas.length,
      totalSaidasProduzidas: saidasProduzidas.length,
      totalRecebimentos: saidasRecebidas.length,
      totalPesoKg: totalVolumetriaKg,
      totalVolumetriaKg,
      totalContingente,
    },
    byShift,
    byDay,
    contingenteByDay,
  };
}
