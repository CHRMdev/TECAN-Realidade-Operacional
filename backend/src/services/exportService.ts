import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

async function fetchData(prisma: PrismaClient, from: string, to: string) {
  const fromDate = new Date(from + 'T00:00:00.000Z');
  const toDate = new Date(to + 'T23:59:59.999Z');
  const where = { createdAt: { gte: fromDate, lte: toDate } };
  const diaWhere = { dia: { gte: fromDate, lte: toDate } };

  const [quebras, entregas, laminas, saidas, contingentes] = await Promise.all([
    prisma.quebra.findMany({ where, include: { user: { select: { username: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.entrega.findMany({ where, include: { awbs: true, user: { select: { username: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.laminaProduzida.findMany({ where, include: { user: { select: { username: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.saidaVoo.findMany({ where, include: { user: { select: { username: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.contingente.findMany({ where: diaWhere, include: { user: { select: { username: true } } }, orderBy: [{ dia: 'asc' }, { shift: 'asc' }] }),
  ]);
  return { quebras, entregas, laminas, saidas, contingentes };
}

export async function exportExcel(
  prisma: PrismaClient,
  from: string,
  to: string
): Promise<Buffer> {
  const { quebras, entregas, laminas, saidas, contingentes } = await fetchData(prisma, from, to);
  const totalAWBs = entregas.reduce((sum, e) => sum + e.awbs.length, 0);
  const totalPesoVoos = saidas.reduce((sum, s) => sum + (s.pesoKg ?? 0), 0);
  const totalTripulantes = contingentes.reduce((sum, c) => sum + c.quantidadeTripulantes, 0);

  const wb = XLSX.utils.book_new();

  // Resumo
  const resumoData = [
    ['KPI', 'Total'],
    ['Desembarques (Quebras)', quebras.length],
    ['Retiras (Entregas)', entregas.length],
    ['AWBs', totalAWBs],
    ['Produção (Lâminas)', laminas.length],
    ['Saídas de Voo', saidas.length],
    ['Volumetria total (kg)', Math.round(totalPesoVoos)],
    ['Contingente total (tripulantes)', totalTripulantes],
    ['Período', `${from} a ${to}`],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoData), 'Resumo');

  // Desembarque (Quebras)
  const quebrasRows: any[][] = [['ID', 'Usuário', 'Turno', 'Voo', 'ULD', 'Data']];
  quebras.forEach((q) =>
    quebrasRows.push([q.id, q.user.username, q.shift, q.flightNumber, q.uldNumber, format(q.createdAt, 'dd/MM/yyyy HH:mm')])
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(quebrasRows), 'Desembarque');

  // Retira (Entregas)
  const entregasRows: any[][] = [['ID', 'Usuário', 'Turno', 'Tipo', 'ULD', 'AWBs', 'Data']];
  entregas.forEach((e) =>
    entregasRows.push([e.id, e.user.username, e.shift, e.deliveryType, e.uldNumber || '', e.awbs.map((a) => a.awbNumber).join(', '), format(e.createdAt, 'dd/MM/yyyy HH:mm')])
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(entregasRows), 'Retira');

  // Produção (Lâminas)
  const laminasRows: any[][] = [['ID', 'Usuário', 'Turno', 'ULD', 'Cliente', 'Data']];
  laminas.forEach((l) =>
    laminasRows.push([l.id, l.user.username, l.shift, l.uldNumber, l.clientName, format(l.createdAt, 'dd/MM/yyyy HH:mm')])
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(laminasRows), 'Produção');

  // Volumetria (SaidaVoo + peso)
  const saidasRows: any[][] = [['ID', 'Usuário', 'Turno', 'Voo', 'Peso (kg)', 'Data']];
  saidas.forEach((s) =>
    saidasRows.push([s.id, s.user.username, s.shift, s.flightNumber, s.pesoKg ?? '', format(s.createdAt, 'dd/MM/yyyy HH:mm')])
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(saidasRows), 'Volumetria');

  // Contingente
  const contRows: any[][] = [['ID', 'Usuário', 'Turno', 'Tripulantes', 'Dia']];
  contingentes.forEach((c) =>
    contRows.push([c.id, c.user.username, c.shift, c.quantidadeTripulantes, format(c.dia, 'dd/MM/yyyy')])
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contRows), 'Contingente');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export async function exportPdf(
  prisma: PrismaClient,
  from: string,
  to: string
): Promise<Buffer> {
  const { quebras, entregas, laminas, saidas, contingentes } = await fetchData(prisma, from, to);
  const totalAWBs = entregas.reduce((sum, e) => sum + e.awbs.length, 0);
  const totalPesoVoos = saidas.reduce((sum, s) => sum + (s.pesoKg ?? 0), 0);
  const totalTripulantes = contingentes.reduce((sum, c) => sum + c.quantidadeTripulantes, 0);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('TECAN — Relatório Operacional', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Período: ${from} a ${to}`, { align: 'center' });
    doc.moveDown(1.5);

    // KPIs
    doc.fontSize(14).font('Helvetica-Bold').text('Resumo Geral');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Desembarques: ${quebras.length}`);
    doc.text(`Retiras: ${entregas.length}`);
    doc.text(`AWBs: ${totalAWBs}`);
    doc.text(`Produção: ${laminas.length}`);
    doc.text(`Saídas de Voo: ${saidas.length}`);
    doc.text(`Volumetria total: ${Math.round(totalPesoVoos)} kg`);
    doc.text(`Contingente total: ${totalTripulantes} tripulantes`);
    doc.moveDown(1.5);

    // Por turno
    doc.fontSize(14).font('Helvetica-Bold').text('Breakdown por Turno');
    doc.moveDown(0.5);
    ['A', 'B', 'C'].forEach((shift) => {
      const q = quebras.filter((x) => x.shift === shift).length;
      const e = entregas.filter((x) => x.shift === shift).length;
      const awbs = entregas.filter((x) => x.shift === shift).reduce((sum, x) => sum + x.awbs.length, 0);
      const l = laminas.filter((x) => x.shift === shift).length;
      const s = saidas.filter((x) => x.shift === shift).length;
      const peso = saidas.filter((x) => x.shift === shift).reduce((sum, x) => sum + (x.pesoKg ?? 0), 0);
      const trip = contingentes.filter((x) => x.shift === shift).reduce((sum, x) => sum + x.quantidadeTripulantes, 0);
      doc.fontSize(12).font('Helvetica-Bold').text(`Turno ${shift}:`);
      doc.fontSize(11).font('Helvetica').text(`  Desembarques: ${q} | Retiras: ${e} | AWBs: ${awbs} | Produção: ${l} | Saídas: ${s} | Peso: ${Math.round(peso)} kg | Tripulantes: ${trip}`);
      doc.moveDown(0.5);
    });

    doc.end();
  });
}
