/**
 * Seed — dados fictícios para janeiro e fevereiro de 2025
 *
 * Médias diárias:
 *   Lâminas produzidas : ~16/dia
 *   Lâminas entregues  : 3/dia  (deliveryType LAMINA)
 *   AWBs totais        : ~30/dia
 *   Desembarques       : 12-14/dia
 *   Saídas de voo      : 3/dia
 *   Peso               : ~22 000 kg por saída (3 entradas/dia ≈ 66 000 kg)
 *
 * Usuários criados se não existirem:
 *   turno_a / turno_b / turno_c — senha: Tecan@2026
 *
 * Execução contra o Railway:
 *   cd backend
 *   railway run npx tsx prisma/seed.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function rf(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function shiftOffset(shift: 'A' | 'B' | 'C') {
  const base: Record<string, number> = { A: 1, B: 9, C: 17 };
  return (base[shift] + ri(0, 7)) * 3_600_000;
}

const FLIGHTS = ['AD1001','AD1002','AD1003','AD2001','AD2002','AD3001','AD3002','AD4001','AD5001','AD6001'];
const CLIENTS = ['LATAM Cargo','DHL Express','FedEx Brasil','Correios','Amazon Logística','Mercado Livre','Shopee Express','Magazine Luiza','B2W Fulfillment','Via Varejo'];

const uld     = () => `PAG${ri(10000,99999)}R${ri(1,9)}`;
const awbNum  = () => `${ri(100,999)}-${ri(10000000,99999999)}`;
const flight  = () => FLIGHTS[ri(0, FLIGHTS.length - 1)];
const client  = () => CLIENTS[ri(0, CLIENTS.length - 1)];

async function main() {
  console.log('🌱  Seed iniciado — janeiro e fevereiro de 2025\n');

  // ── Usuários ──────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('Tecan@2026', 10);
  const SHIFTS = ['A', 'B', 'C'] as const;
  const shiftUsers: Record<string, string> = {};

  for (const s of SHIFTS) {
    const u = await prisma.user.upsert({
      where: { username: `turno_${s.toLowerCase()}` },
      update: {},
      create: {
        username: `turno_${s.toLowerCase()}`,
        firstName: 'Operador',
        lastName: `Turno ${s}`,
        passwordHash: hash,
        role: 'operator',
      },
    });
    shiftUsers[s] = u.id;
    console.log(`  ✅  Usuário turno_${s.toLowerCase()} (${u.id.slice(0, 8)}…)`);
  }

  // ── Períodos ──────────────────────────────────────────────────────────────
  const PERIODS = [
    { year: 2025, month: 1, days: 31, label: 'Janeiro/2025' },
    { year: 2025, month: 2, days: 28, label: 'Fevereiro/2025' },
  ];

  const totals = { laminas: 0, laminasEntregues: 0, awbs: 0, quebras: 0, saidas: 0, peso: 0, entregas: 0 };
  let totalDays = 0;

  for (const { year, month, days, label } of PERIODS) {
    console.log(`\n  📆  ${label}`);

    for (let day = 1; day <= days; day++) {
      process.stdout.write(`  📅  ${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year} … `);

      const baseMs = Date.UTC(year, month - 1, day);

      for (const shift of SHIFTS) {
        const uid = shiftUsers[shift];
        const ts  = (offset: number) => new Date(baseMs + shiftOffset(shift) + offset);

        // Lâminas produzidas: ~16/dia
        const lamCount = shift === 'A' ? ri(5, 7) : shift === 'B' ? ri(4, 7) : ri(3, 6);
        for (let i = 0; i < lamCount; i++) {
          await prisma.laminaProduzida.create({
            data: { userId: uid, shift, uldNumber: uld(), clientName: client(), createdAt: ts(i * 60_000) },
          });
        }
        totals.laminas += lamCount;

        // Quebras: 12-14/dia → 4-5 por turno
        const qCount = ri(4, 5);
        for (let i = 0; i < qCount; i++) {
          await prisma.quebra.create({
            data: { userId: uid, shift, flightNumber: flight(), uldNumber: `ULD${ri(100000,999999)}`, createdAt: ts(i * 90_000) },
          });
        }
        totals.quebras += qCount;

        // Entrega LÂMINA: 1/turno = 3/dia, AWBs: 2-4
        const awbLam = ri(2, 4);
        await prisma.entrega.create({
          data: {
            userId: uid, shift, deliveryType: 'LAMINA', uldNumber: uld(),
            createdAt: ts(5 * 60_000),
            awbs: { create: Array.from({ length: awbLam }, () => ({ awbNumber: awbNum() })) },
          },
        });
        totals.laminasEntregues++;
        totals.entregas++;
        totals.awbs += awbLam;

        // Entregas VOLUME: 2/turno, AWBs: 3-4 cada (~21 AWBs volume/dia)
        for (let e = 0; e < 2; e++) {
          const awbVol = ri(3, 4);
          await prisma.entrega.create({
            data: {
              userId: uid, shift, deliveryType: 'VOLUME',
              createdAt: ts((10 + e * 5) * 60_000),
              awbs: { create: Array.from({ length: awbVol }, () => ({ awbNumber: awbNum() })) },
            },
          });
          totals.entregas++;
          totals.awbs += awbVol;
        }

        // Saída de voo: 1/turno = 3/dia
        await prisma.saidaVoo.create({
          data: { userId: uid, shift, flightNumber: `${flight()}${day}`, createdAt: ts(20 * 60_000) },
        });
        totals.saidas++;

        // Peso: ~22 000 kg por saída (±20%)
        const kg = Math.round(rf(17_600, 26_400));
        await prisma.pesoMovimentado.create({
          data: { userId: uid, shift, pesoKg: kg, createdAt: ts(21 * 60_000) },
        });
        totals.peso += kg;
      }

      console.log('✅');
      totalDays++;
    }
  }

  // ── Resumo ────────────────────────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────────');
  console.log('  📊  Resumo do seed (jan + fev 2025)');
  console.log('──────────────────────────────────────────────────');
  console.log(`  Dias gerados       : ${totalDays}`);
  console.log(`  Lâminas produzidas : ${totals.laminas}  (média ${(totals.laminas / totalDays).toFixed(1)}/dia)`);
  console.log(`  Lâminas entregues  : ${totals.laminasEntregues}  (${(totals.laminasEntregues / totalDays).toFixed(1)}/dia)`);
  console.log(`  AWBs totais        : ${totals.awbs}  (média ${(totals.awbs / totalDays).toFixed(1)}/dia)`);
  console.log(`  Quebras            : ${totals.quebras}  (média ${(totals.quebras / totalDays).toFixed(1)}/dia)`);
  console.log(`  Saídas de voo      : ${totals.saidas}  (${(totals.saidas / totalDays).toFixed(1)}/dia)`);
  console.log(`  Peso total         : ${totals.peso.toLocaleString('pt-BR')} kg`);
  console.log(`  Peso médio/dia     : ${Math.round(totals.peso / totalDays).toLocaleString('pt-BR')} kg`);
  console.log('──────────────────────────────────────────────────');
  console.log('\n  Filtros no dashboard:');
  console.log('    Janeiro:   01/01/2025 → 31/01/2025');
  console.log('    Fevereiro: 01/02/2025 → 28/02/2025\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
