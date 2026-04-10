import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

async function fetchData(prisma: PrismaClient, from: string, to: string) {
  const fromDate = new Date(from + 'T00:00:00.000Z');
  const toDate = new Date(to + 'T23:59:59.999Z');
  const where = { createdAt: { gte: fromDate, lte: toDate } };

  const [quebras, entregas, laminas, saidas] = await Promise.all([
    prisma.quebra.findMany({ where, include: { user: { select: { username: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.entrega.findMany({ where, include: { awbs: true, user: { select: { username: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.laminaProduzida.findMany({ where, include: { user: { select: { username: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.saidaVoo.findMany({ where, include: { user: { select: { username: true } } }, orderBy: { createdAt: 'asc' } }),
  ]);
  return { quebras, entregas, laminas, saidas };
}

export async function exportExcel(
  prisma: PrismaClient,
  from: string,
  to: string
): Promise<Buffer> {
  const { quebras, entregas, laminas, saidas } = await fetchData(prisma, from, to);
  const totalAWBs = entregas.reduce((sum, e) => sum + e.awbs.length, 0);

  const wb = XLSX.utils.book_new();

  // Resumo
  const resumoData = [
    ['KPI', 'Total'],
    ['Quebras', quebras.length],
    ['Entregas', entregas.length],
    ['AWBs', totalAWBs],
    ['Lâminas Produzidas', laminas.length],
    ['Saídas de Voo', saidas.length],
    ['Período', `${from} a ${to}`],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoData), 'Resumo');

  // Quebras
  const quebrasRows: any[][] = [['ID', 'Usuário', 'Turno', 'Voo', 'ULD', 'Data']];
  quebras.forEach((q) =>
    quebrasRows.push([q.id, q.user.username, q.shift, q.flightNumber, q.uldNumber, format(q.createdAt, 'dd/MM/yyyy HH:mm')])
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(quebrasRows), 'Quebras');

  // Entregas
  const entregasRows: any[][] = [['ID', 'Usuário', 'Turno', 'Tipo', 'ULD', 'AWBs', 'Data']];
  entregas.forEach((e) =>
    entregasRows.push([e.id, e.user.username, e.shift, e.deliveryType, e.uldNumber || '', e.awbs.map((a) => a.awbNumber).join(', '), format(e.createdAt, 'dd/MM/yyyy HH:mm')])
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(entregasRows), 'Entregas');

  // LaminasProduzidas
  const laminasRows: any[][] = [['ID', 'Usuário', 'Turno', 'ULD', 'Cliente', 'Data']];
  laminas.forEach((l) =>
    laminasRows.push([l.id, l.user.username, l.shift, l.uldNumber, l.clientName, format(l.createdAt, 'dd/MM/yyyy HH:mm')])
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(laminasRows), 'LaminasProduzidas');

  // SaidasVoo
  const saidasRows: any[][] = [['ID', 'Usuário', 'Turno', 'Voo', 'Data']];
  saidas.forEach((s) =>
    saidasRows.push([s.id, s.user.username, s.shift, s.flightNumber, format(s.createdAt, 'dd/MM/yyyy HH:mm')])
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(saidasRows), 'SaidasVoo');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export async function exportPdf(
  prisma: PrismaClient,
  from: string,
  to: string
): Promise<Buffer> {
  const { quebras, entregas, laminas, saidas } = await fetchData(prisma, from, to);
  const totalAWBs = entregas.reduce((sum, e) => sum + e.awbs.length, 0);

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
    doc.text(`Quebras: ${quebras.length}`);
    doc.text(`Entregas: ${entregas.length}`);
    doc.text(`AWBs: ${totalAWBs}`);
    doc.text(`Lâminas Produzidas: ${laminas.length}`);
    doc.text(`Saídas de Voo: ${saidas.length}`);
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
      doc.fontSize(12).font('Helvetica-Bold').text(`Turno ${shift}:`);
      doc.fontSize(11).font('Helvetica').text(`  Quebras: ${q} | Entregas: ${e} | AWBs: ${awbs} | Lâminas: ${l} | Saídas: ${s}`);
      doc.moveDown(0.5);
    });

    doc.end();
  });
}
