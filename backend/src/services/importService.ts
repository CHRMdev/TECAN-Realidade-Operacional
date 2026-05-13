import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';
import { parse } from 'date-fns';

const VOO = /^AD\d{4}$/;
const ULD = /^(PAG|PAJ)\d{5}(R7|R9|WD|TOT|TTL)$/;
const AWB = /^577-\d{8}$/;

const SHEET_KEYS = ['DESEMBARQUE', 'RETIRA', 'PRODUCAO', 'VOLUMETRIA', 'CONTINGENTE'] as const;

export interface ImportError {
  sheet: string;
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ImportResult {
  created: {
    desembarques: number;
    retiras: number;
    producoes: number;
    volumetrias: number;
    contingentes: number;
  };
  errors: ImportError[];
  errorReportBase64?: string;
}

// ───────────────────────────────────────────────────────────────────────
// Template generation
// ───────────────────────────────────────────────────────────────────────

const HEADER_FILL = 'FF1A78D4';
const HEADER_FONT_COLOR = 'FFFFFFFF';

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.font = { bold: true, color: { argb: HEADER_FONT_COLOR } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF1E3355' } },
    };
  });
}

function addDropdown(ws: ExcelJS.Worksheet, col: string, options: string[]) {
  const formula = `"${options.join(',')}"`;
  for (let row = 2; row <= 1000; row++) {
    ws.getCell(`${col}${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [formula],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Valor inválido',
      error: `Escolha um dos valores: ${options.join(', ')}`,
    };
  }
}

function addDateValidation(ws: ExcelJS.Worksheet, col: string) {
  for (let row = 2; row <= 1000; row++) {
    ws.getCell(`${col}${row}`).numFmt = 'dd/mm/yyyy';
  }
}

function addPositiveNumberValidation(ws: ExcelJS.Worksheet, col: string, isInteger: boolean) {
  for (let row = 2; row <= 1000; row++) {
    ws.getCell(`${col}${row}`).dataValidation = {
      type: isInteger ? 'whole' : 'decimal',
      operator: 'greaterThan',
      formulae: [0],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Valor inválido',
      error: isInteger ? 'Digite um número inteiro positivo' : 'Digite um número positivo',
    };
  }
}

export async function generateTemplate(users: string[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'TECAN';
  wb.created = new Date();

  // ─── Instruções ─────────────────────────────────────────────────────
  const inst = wb.addWorksheet('Instruções');
  inst.getColumn(1).width = 100;
  const instLines = [
    'TECAN — Template de Importação de Atividades',
    '',
    'Como usar:',
    '  1. Preencha as 5 abas com os registros do plantão.',
    '  2. Cada linha é um registro. Linhas em branco são ignoradas.',
    '  3. Mantenha o cabeçalho intacto — não renomeie as colunas.',
    '  4. Salve o arquivo (Ctrl+S).',
    '  5. Faça upload na aba "Importar Planilha" do site.',
    '',
    'Formato dos campos:',
    '  • Data → dd/mm/aaaa (use o calendário do Excel).',
    '  • Turno → A, B ou C (use o dropdown).',
    '  • Usuario → username do operador (use o dropdown).',
    '  • NumVoo → AD####  (ex: AD1234).',
    '  • ULD → (PAG|PAJ)#####(R7|R9|WD|TOT|TTL)  (ex: PAG12345R7).',
    '  • AWBs → 577-########  (ex: 577-12345678). Múltiplos, separados por ;',
    '  • PesoKg → número (use ponto, não vírgula: 1523.5).',
    '  • QtdTripulantes → número inteiro positivo.',
    '',
    'Regras especiais:',
    '  • Aba RETIRA: se "ULD" estiver vazia, será registrada como tipo VOLUME.',
    '    Se preenchida, será tipo LAMINA.',
    '  • Aba CONTINGENTE: só pode existir 1 lançamento por (data, turno).',
    '    Reenviar sobrescreve o valor anterior.',
    '',
    'Em caso de erro, o sistema retorna uma planilha com as linhas inválidas',
    'marcadas em vermelho e a coluna "Erro" preenchida com o motivo.',
  ];
  instLines.forEach((line) => inst.addRow([line]));
  inst.getRow(1).font = { bold: true, size: 14 };

  // ─── DESEMBARQUE ────────────────────────────────────────────────────
  const ws1 = wb.addWorksheet('DESEMBARQUE');
  ws1.columns = [
    { header: 'Data', key: 'data', width: 14 },
    { header: 'Turno', key: 'turno', width: 9 },
    { header: 'Usuario', key: 'usuario', width: 22 },
    { header: 'NumVoo', key: 'voo', width: 12 },
    { header: 'ULD', key: 'uld', width: 18 },
  ];
  applyHeaderStyle(ws1.getRow(1));
  addDateValidation(ws1, 'A');
  addDropdown(ws1, 'B', ['A', 'B', 'C']);
  addDropdown(ws1, 'C', users);

  // ─── RETIRA ─────────────────────────────────────────────────────────
  const ws2 = wb.addWorksheet('RETIRA');
  ws2.columns = [
    { header: 'Data', key: 'data', width: 14 },
    { header: 'Turno', key: 'turno', width: 9 },
    { header: 'Usuario', key: 'usuario', width: 22 },
    { header: 'ULD (opcional, se preencher = LAMINA)', key: 'uld', width: 38 },
    { header: 'AWBs (separe por ;)', key: 'awbs', width: 36 },
    { header: 'Cliente', key: 'cliente', width: 22 },
  ];
  applyHeaderStyle(ws2.getRow(1));
  addDateValidation(ws2, 'A');
  addDropdown(ws2, 'B', ['A', 'B', 'C']);
  addDropdown(ws2, 'C', users);

  // ─── PRODUCAO ──────────────────────────────────────────────────────
  const ws3 = wb.addWorksheet('PRODUCAO');
  ws3.columns = [
    { header: 'Data', key: 'data', width: 14 },
    { header: 'Turno', key: 'turno', width: 9 },
    { header: 'Usuario', key: 'usuario', width: 22 },
    { header: 'ULD', key: 'uld', width: 18 },
    { header: 'Cliente', key: 'cliente', width: 22 },
  ];
  applyHeaderStyle(ws3.getRow(1));
  addDateValidation(ws3, 'A');
  addDropdown(ws3, 'B', ['A', 'B', 'C']);
  addDropdown(ws3, 'C', users);

  // ─── VOLUMETRIA ────────────────────────────────────────────────────
  const ws4 = wb.addWorksheet('VOLUMETRIA');
  ws4.columns = [
    { header: 'Data', key: 'data', width: 14 },
    { header: 'Turno', key: 'turno', width: 9 },
    { header: 'Usuario', key: 'usuario', width: 22 },
    { header: 'NumVoo', key: 'voo', width: 12 },
    { header: 'PesoKg', key: 'peso', width: 12 },
  ];
  applyHeaderStyle(ws4.getRow(1));
  addDateValidation(ws4, 'A');
  addDropdown(ws4, 'B', ['A', 'B', 'C']);
  addDropdown(ws4, 'C', users);
  addPositiveNumberValidation(ws4, 'E', false);

  // ─── CONTINGENTE ───────────────────────────────────────────────────
  const ws5 = wb.addWorksheet('CONTINGENTE');
  ws5.columns = [
    { header: 'Data', key: 'data', width: 14 },
    { header: 'Turno', key: 'turno', width: 9 },
    { header: 'Usuario', key: 'usuario', width: 22 },
    { header: 'QtdTripulantes', key: 'qtd', width: 16 },
  ];
  applyHeaderStyle(ws5.getRow(1));
  addDateValidation(ws5, 'A');
  addDropdown(ws5, 'B', ['A', 'B', 'C']);
  addDropdown(ws5, 'C', users);
  addPositiveNumberValidation(ws5, 'D', true);

  const ab = await wb.xlsx.writeBuffer();
  return Buffer.from(ab);
}

// ───────────────────────────────────────────────────────────────────────
// Parsing helpers
// ───────────────────────────────────────────────────────────────────────

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v).trim();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object' && v !== null && 'result' in v) {
    return cellToString((v as { result?: unknown }).result);
  }
  if (typeof v === 'object' && v !== null && 'text' in v) {
    return cellToString((v as { text?: unknown }).text);
  }
  return String(v).trim();
}

function cellToDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === 'number') {
    // Excel serial date number
    const utcDays = Math.floor(v - 25569);
    const utcMs = utcDays * 86400 * 1000;
    return new Date(utcMs);
  }
  if (typeof v === 'string') {
    const s = v.trim();
    const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'd/M/yyyy', 'dd-MM-yyyy'];
    for (const fmt of formats) {
      const d = parse(s, fmt, new Date());
      if (!isNaN(d.getTime())) return d;
    }
    const iso = new Date(s);
    if (!isNaN(iso.getTime())) return iso;
  }
  return null;
}

function cellToNumber(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.trim().replace(',', '.');
    const n = parseFloat(cleaned);
    if (!isNaN(n)) return n;
  }
  if (v && typeof v === 'object' && 'result' in v) return cellToNumber((v as { result?: unknown }).result);
  return null;
}

function isRowEmpty(values: unknown[]): boolean {
  return values.every((v) => {
    const s = cellToString(v);
    return s === '' || s === 'null' || s === 'undefined';
  });
}

function normalizeDia(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// ───────────────────────────────────────────────────────────────────────
// Process import
// ───────────────────────────────────────────────────────────────────────

export async function processImport(
  prisma: PrismaClient,
  buffer: Buffer,
  uploaderUserId: string
): Promise<ImportResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  const usernameToId = new Map(users.map((u) => [u.username.toLowerCase(), u.id]));

  const result: ImportResult = {
    created: { desembarques: 0, retiras: 0, producoes: 0, volumetrias: 0, contingentes: 0 },
    errors: [],
  };

  function resolveUserId(usernameRaw: string, sheet: string, row: number): string | null {
    const username = usernameRaw.toLowerCase();
    const id = usernameToId.get(username);
    if (!id) {
      result.errors.push({
        sheet,
        row,
        field: 'Usuario',
        value: usernameRaw,
        message: `Usuário "${usernameRaw}" não existe no sistema`,
      });
      return null;
    }
    return id;
  }

  function pushError(sheet: string, row: number, field: string, value: unknown, message: string) {
    result.errors.push({ sheet, row, field, value: cellToString(value), message });
  }

  // ─── DESEMBARQUE ────────────────────────────────────────────────────
  const wsDes = wb.getWorksheet('DESEMBARQUE');
  if (wsDes) {
    for (let r = 2; r <= wsDes.rowCount; r++) {
      const row = wsDes.getRow(r);
      const values = [row.getCell(1).value, row.getCell(2).value, row.getCell(3).value, row.getCell(4).value, row.getCell(5).value];
      if (isRowEmpty(values)) continue;

      const [dataVal, turnoVal, usuarioVal, vooVal, uldVal] = values;
      const data = cellToDate(dataVal);
      if (!data) { pushError('DESEMBARQUE', r, 'Data', dataVal, 'Data inválida ou vazia'); continue; }

      const turno = cellToString(turnoVal).toUpperCase();
      if (!['A', 'B', 'C'].includes(turno)) { pushError('DESEMBARQUE', r, 'Turno', turnoVal, 'Turno deve ser A, B ou C'); continue; }

      const userId = resolveUserId(cellToString(usuarioVal), 'DESEMBARQUE', r);
      if (!userId) continue;

      const voo = cellToString(vooVal).toUpperCase();
      if (!VOO.test(voo)) { pushError('DESEMBARQUE', r, 'NumVoo', vooVal, 'NumVoo deve ser AD####'); continue; }

      const uld = cellToString(uldVal).toUpperCase();
      if (!ULD.test(uld)) { pushError('DESEMBARQUE', r, 'ULD', uldVal, 'ULD deve ser (PAG|PAJ)#####(R7|R9|WD|TOT|TTL)'); continue; }

      try {
        await prisma.quebra.create({
          data: { userId, shift: turno, flightNumber: voo, uldNumber: uld, createdAt: data },
        });
        result.created.desembarques++;
      } catch (e) {
        pushError('DESEMBARQUE', r, 'sistema', '', `Erro ao salvar: ${(e as Error).message}`);
      }
    }
  }

  // ─── RETIRA ─────────────────────────────────────────────────────────
  const wsRet = wb.getWorksheet('RETIRA');
  if (wsRet) {
    for (let r = 2; r <= wsRet.rowCount; r++) {
      const row = wsRet.getRow(r);
      const values = [row.getCell(1).value, row.getCell(2).value, row.getCell(3).value, row.getCell(4).value, row.getCell(5).value, row.getCell(6).value];
      if (isRowEmpty(values)) continue;

      const [dataVal, turnoVal, usuarioVal, uldVal, awbsVal, clienteVal] = values;
      const data = cellToDate(dataVal);
      if (!data) { pushError('RETIRA', r, 'Data', dataVal, 'Data inválida ou vazia'); continue; }

      const turno = cellToString(turnoVal).toUpperCase();
      if (!['A', 'B', 'C'].includes(turno)) { pushError('RETIRA', r, 'Turno', turnoVal, 'Turno deve ser A, B ou C'); continue; }

      const userId = resolveUserId(cellToString(usuarioVal), 'RETIRA', r);
      if (!userId) continue;

      const uldRaw = cellToString(uldVal).toUpperCase();
      const isLamina = uldRaw !== '';
      if (isLamina && !ULD.test(uldRaw)) {
        pushError('RETIRA', r, 'ULD', uldVal, 'ULD inválida (deixe vazio para tipo VOLUME)');
        continue;
      }

      const awbsRaw = cellToString(awbsVal);
      const awbList = awbsRaw.split(/[;,]/).map((s) => s.trim().toUpperCase()).filter(Boolean);
      if (awbList.length === 0) { pushError('RETIRA', r, 'AWBs', awbsVal, 'Pelo menos 1 AWB é obrigatório'); continue; }

      const invalidAwb = awbList.find((a) => !AWB.test(a));
      if (invalidAwb) { pushError('RETIRA', r, 'AWBs', invalidAwb, `AWB "${invalidAwb}" inválida (esperado 577-########)`); continue; }

      const cliente = cellToString(clienteVal);
      if (!cliente) { pushError('RETIRA', r, 'Cliente', clienteVal, 'Cliente obrigatório'); continue; }

      try {
        await prisma.entrega.create({
          data: {
            userId,
            shift: turno,
            deliveryType: isLamina ? 'LAMINA' : 'VOLUME',
            uldNumber: isLamina ? uldRaw : null,
            createdAt: data,
            awbs: { create: awbList.map((awbNumber) => ({ awbNumber })) },
          },
        });
        result.created.retiras++;
      } catch (e) {
        pushError('RETIRA', r, 'sistema', '', `Erro ao salvar: ${(e as Error).message}`);
      }
    }
  }

  // ─── PRODUCAO ──────────────────────────────────────────────────────
  const wsProd = wb.getWorksheet('PRODUCAO');
  if (wsProd) {
    for (let r = 2; r <= wsProd.rowCount; r++) {
      const row = wsProd.getRow(r);
      const values = [row.getCell(1).value, row.getCell(2).value, row.getCell(3).value, row.getCell(4).value, row.getCell(5).value];
      if (isRowEmpty(values)) continue;

      const [dataVal, turnoVal, usuarioVal, uldVal, clienteVal] = values;
      const data = cellToDate(dataVal);
      if (!data) { pushError('PRODUCAO', r, 'Data', dataVal, 'Data inválida ou vazia'); continue; }

      const turno = cellToString(turnoVal).toUpperCase();
      if (!['A', 'B', 'C'].includes(turno)) { pushError('PRODUCAO', r, 'Turno', turnoVal, 'Turno deve ser A, B ou C'); continue; }

      const userId = resolveUserId(cellToString(usuarioVal), 'PRODUCAO', r);
      if (!userId) continue;

      const uld = cellToString(uldVal).toUpperCase();
      if (!uld) { pushError('PRODUCAO', r, 'ULD', uldVal, 'ULD obrigatória'); continue; }

      const cliente = cellToString(clienteVal);
      if (!cliente) { pushError('PRODUCAO', r, 'Cliente', clienteVal, 'Cliente obrigatório'); continue; }

      try {
        await prisma.laminaProduzida.create({
          data: { userId, shift: turno, uldNumber: uld, clientName: cliente, createdAt: data },
        });
        result.created.producoes++;
      } catch (e) {
        pushError('PRODUCAO', r, 'sistema', '', `Erro ao salvar: ${(e as Error).message}`);
      }
    }
  }

  // ─── VOLUMETRIA ────────────────────────────────────────────────────
  const wsVol = wb.getWorksheet('VOLUMETRIA');
  if (wsVol) {
    for (let r = 2; r <= wsVol.rowCount; r++) {
      const row = wsVol.getRow(r);
      const values = [row.getCell(1).value, row.getCell(2).value, row.getCell(3).value, row.getCell(4).value, row.getCell(5).value];
      if (isRowEmpty(values)) continue;

      const [dataVal, turnoVal, usuarioVal, vooVal, pesoVal] = values;
      const data = cellToDate(dataVal);
      if (!data) { pushError('VOLUMETRIA', r, 'Data', dataVal, 'Data inválida ou vazia'); continue; }

      const turno = cellToString(turnoVal).toUpperCase();
      if (!['A', 'B', 'C'].includes(turno)) { pushError('VOLUMETRIA', r, 'Turno', turnoVal, 'Turno deve ser A, B ou C'); continue; }

      const userId = resolveUserId(cellToString(usuarioVal), 'VOLUMETRIA', r);
      if (!userId) continue;

      const voo = cellToString(vooVal).toUpperCase();
      if (!VOO.test(voo)) { pushError('VOLUMETRIA', r, 'NumVoo', vooVal, 'NumVoo deve ser AD####'); continue; }

      const peso = cellToNumber(pesoVal);
      if (peso === null || peso <= 0) { pushError('VOLUMETRIA', r, 'PesoKg', pesoVal, 'Peso deve ser um número positivo'); continue; }

      try {
        await prisma.saidaVoo.create({
          data: { userId, shift: turno, flightNumber: voo, pesoKg: peso, createdAt: data },
        });
        result.created.volumetrias++;
      } catch (e) {
        pushError('VOLUMETRIA', r, 'sistema', '', `Erro ao salvar: ${(e as Error).message}`);
      }
    }
  }

  // ─── CONTINGENTE ───────────────────────────────────────────────────
  const wsCon = wb.getWorksheet('CONTINGENTE');
  if (wsCon) {
    for (let r = 2; r <= wsCon.rowCount; r++) {
      const row = wsCon.getRow(r);
      const values = [row.getCell(1).value, row.getCell(2).value, row.getCell(3).value, row.getCell(4).value];
      if (isRowEmpty(values)) continue;

      const [dataVal, turnoVal, usuarioVal, qtdVal] = values;
      const data = cellToDate(dataVal);
      if (!data) { pushError('CONTINGENTE', r, 'Data', dataVal, 'Data inválida ou vazia'); continue; }

      const turno = cellToString(turnoVal).toUpperCase();
      if (!['A', 'B', 'C'].includes(turno)) { pushError('CONTINGENTE', r, 'Turno', turnoVal, 'Turno deve ser A, B ou C'); continue; }

      const userId = resolveUserId(cellToString(usuarioVal), 'CONTINGENTE', r);
      if (!userId) continue;

      const qtd = cellToNumber(qtdVal);
      if (qtd === null || qtd <= 0 || !Number.isInteger(qtd)) { pushError('CONTINGENTE', r, 'QtdTripulantes', qtdVal, 'Quantidade deve ser um inteiro positivo'); continue; }

      const dia = normalizeDia(data);

      try {
        await prisma.contingente.upsert({
          where: { dia_shift: { dia, shift: turno } },
          update: { quantidadeTripulantes: qtd, userId },
          create: { userId, shift: turno, quantidadeTripulantes: qtd, dia },
        });
        result.created.contingentes++;
      } catch (e) {
        pushError('CONTINGENTE', r, 'sistema', '', `Erro ao salvar: ${(e as Error).message}`);
      }
    }
  }

  // ─── Error report ───────────────────────────────────────────────────
  if (result.errors.length > 0) {
    const reportBuf = await buildErrorReport(buffer, result.errors);
    result.errorReportBase64 = reportBuf.toString('base64');
  }

  return result;
}

// ───────────────────────────────────────────────────────────────────────
// Error report — marca células inválidas em vermelho e adiciona coluna "Erro"
// ───────────────────────────────────────────────────────────────────────

async function buildErrorReport(originalBuffer: Buffer, errors: ImportError[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(originalBuffer as unknown as ArrayBuffer);

  const SHEET_FIELD_COL: Record<string, Record<string, number>> = {
    DESEMBARQUE: { Data: 1, Turno: 2, Usuario: 3, NumVoo: 4, ULD: 5 },
    RETIRA: { Data: 1, Turno: 2, Usuario: 3, ULD: 4, AWBs: 5, Cliente: 6 },
    PRODUCAO: { Data: 1, Turno: 2, Usuario: 3, ULD: 4, Cliente: 5 },
    VOLUMETRIA: { Data: 1, Turno: 2, Usuario: 3, NumVoo: 4, PesoKg: 5 },
    CONTINGENTE: { Data: 1, Turno: 2, Usuario: 3, QtdTripulantes: 4 },
  };

  const RED_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFECACA' },
  };

  const errorsBySheet = errors.reduce<Record<string, ImportError[]>>((acc, e) => {
    (acc[e.sheet] = acc[e.sheet] || []).push(e);
    return acc;
  }, {});

  for (const sheetName of SHEET_KEYS) {
    const ws = wb.getWorksheet(sheetName);
    if (!ws) continue;

    const sheetErrors = errorsBySheet[sheetName] || [];
    const errorCol = (Object.keys(SHEET_FIELD_COL[sheetName]).length) + 1;

    // Header "Erro"
    const headerCell = ws.getCell(1, errorCol);
    headerCell.value = 'Erro';
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
    headerCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const err of sheetErrors) {
      const colIdx = SHEET_FIELD_COL[sheetName][err.field];
      if (colIdx) {
        const cell = ws.getCell(err.row, colIdx);
        cell.fill = RED_FILL;
      }
      const errorCell = ws.getCell(err.row, errorCol);
      const existing = errorCell.value ? `${cellToString(errorCell.value)} | ` : '';
      errorCell.value = existing + err.message;
      errorCell.font = { color: { argb: 'FFEF4444' } };
    }

    ws.getColumn(errorCol).width = 50;
  }

  const ab = await wb.xlsx.writeBuffer();
  return Buffer.from(ab);
}
