import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ChevronDown, X, Plus, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { postQuebra, postEntrega, postLamina, postSaidaVoo, postContingente } from '../api/atividades';
import { downloadTemplate, uploadExcel, downloadErrorReport, type ImportError, type ImportResult } from '../api/import';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#111e35',
  border: '1px solid #1e3355',
  borderRadius: '12px',
  padding: '20px',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 36px 10px 14px',
  fontSize: '14px',
  backgroundColor: '#0d1a30',
  border: '1.5px solid #1e3355',
  borderRadius: '8px',
  color: '#e2eafc',
  outline: 'none',
  appearance: 'none',
  cursor: 'pointer',
};

const numberInputStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: '14px',
  backgroundColor: '#0d1a30',
  border: '1.5px solid #1e3355',
  borderRadius: '8px',
  color: '#e2eafc',
  outline: 'none',
};

// ─── Validações de padrão ─────────────────────────────────────────────────
const VOO_REGEX = /^AD\d{4}$/;
const ULD_REGEX = /^(PAG|PAJ)\d{4,5}(AD|WD|R7|R9|TOT|TTL)$/;
const ULD_PRODUCAO_REGEX = /^((PAG|PAJ)\d{4,5}(AD|WD|R7|R9|TOT|TTL)|LM\d{5}|CAF\d{4})$/;

function validateVoo(raw: string): string | null {
  const v = raw.trim().toUpperCase();
  if (!v) return 'Informe o número do voo';
  if (VOO_REGEX.test(v)) return null;
  if (!/^AD/.test(v)) return `"${raw}" inválido. Voo deve começar com AD (ex: AD1234)`;
  return `"${raw}" inválido. Após AD devem vir exatamente 4 dígitos (ex: AD1234)`;
}

function validateUld(raw: string, allowProducao = false): string | null {
  const v = raw.trim().toUpperCase();
  if (!v) return 'Informe o número da ULD';
  const re = allowProducao ? ULD_PRODUCAO_REGEX : ULD_REGEX;
  if (re.test(v)) return null;

  // Diagnóstico baseado no prefixo digitado
  if (allowProducao) {
    if (/^LM/.test(v)) return `"${raw}" inválido. LM deve ter exatamente 5 dígitos (ex: LM12345)`;
    if (/^CAF/.test(v)) return `"${raw}" inválido. CAF deve ter exatamente 4 dígitos (ex: CAF1234)`;
  }
  if (/^PA[GJ]/.test(v)) {
    if (!/^PA[GJ]\d{4,5}/.test(v)) {
      return `"${raw}" inválido. Após PAG/PAJ devem vir 4 ou 5 dígitos`;
    }
    return `"${raw}" inválido. Sufixo deve ser AD, WD, R7, R9, TOT ou TTL (ex: PAG12345R7)`;
  }
  const exemplos = allowProducao
    ? 'PAG12345R7, PAG1234AD, LM12345 ou CAF1234'
    : 'PAG12345R7 ou PAG1234AD';
  return `"${raw}" inválido. Esperado: ${exemplos}`;
}

// ─── DESEMBARQUE ──────────────────────────────────────────────────────────
function DesembarqueTab({ shift }: { shift: 'A' | 'B' | 'C' }) {
  const { toast } = useToast();
  const [flightNumber, setFlightNumber] = useState('');
  const [uldNumber, setUldNumber] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vooErr = validateVoo(flightNumber);
    if (vooErr) { toast({ type: 'error', title: 'Voo inválido', description: vooErr }); return; }
    const uldErr = validateUld(uldNumber);
    if (uldErr) { toast({ type: 'error', title: 'ULD inválida', description: uldErr }); return; }
    setLoading(true);
    try {
      await postQuebra({ flightNumber, uldNumber, shift });
      toast({ type: 'success', title: 'Desembarque registrado!', description: `Voo ${flightNumber} — ULD ${uldNumber}` });
      setFlightNumber(''); setUldNumber('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <Input label="Número do Voo" placeholder="Ex: AD1234" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} required />
      <Input label="Número da ULD" placeholder="Ex: PAG12345R7 ou PAG1234AD" value={uldNumber} onChange={(e) => setUldNumber(e.target.value.toUpperCase())} required />
      <Button type="submit" loading={loading}>Registrar Desembarque</Button>
    </form>
  );
}

// ─── RETIRA ───────────────────────────────────────────────────────────────
function RetiraTab({ shift }: { shift: 'A' | 'B' | 'C' }) {
  const { toast } = useToast();
  const [uldNumber, setUldNumber] = useState('');
  const [awbInput, setAwbInput] = useState('');
  const [awbs, setAwbs] = useState<string[]>([]);
  const [cliente, setCliente] = useState('');
  const [loading, setLoading] = useState(false);

  function addAwbs(raw: string) {
    const items = raw.split(/[,;\s]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);
    setAwbs((prev) => [...prev, ...items.filter((a) => !prev.includes(a))]);
    setAwbInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isLamina = uldNumber.trim().length > 0;
    if (isLamina) {
      const uldErr = validateUld(uldNumber);
      if (uldErr) { toast({ type: 'error', title: 'ULD inválida', description: uldErr }); return; }
    }
    if (!awbs.length) { toast({ type: 'error', title: 'Adicione ao menos 1 AWB' }); return; }
    if (!cliente.trim()) { toast({ type: 'error', title: 'Informe o cliente' }); return; }
    setLoading(true);
    try {
      await postEntrega({
        deliveryType: isLamina ? 'LAMINA' : 'VOLUME',
        uldNumber: isLamina ? uldNumber : undefined,
        awbs,
        shift,
      });
      toast({
        type: 'success',
        title: `Retira registrada (${isLamina ? 'LÂMINA' : 'VOLUME'})`,
        description: `${awbs.length} AWB(s) — ${cliente}`,
      });
      setUldNumber(''); setAwbs([]); setCliente('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#7a9bc4' }}>
          ULD (opcional — se preencher = LÂMINA, vazio = VOLUME)
        </label>
        <input
          type="text"
          placeholder="Ex: PAG12345R7 ou PAG1234AD (vazio = VOLUME)"
          value={uldNumber}
          onChange={(e) => setUldNumber(e.target.value.toUpperCase())}
          style={numberInputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
          onBlur={(e) => (e.target.style.borderColor = '#1e3355')}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#7a9bc4' }}>AWBs</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="Digite ou cole AWBs (separe por ;)" value={awbInput}
            onChange={(e) => setAwbInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAwbs(awbInput); } }}
            style={{ ...numberInputStyle, flex: 1 }}
            onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e3355')} />
          <Button type="button" variant="secondary" size="sm" onClick={() => addAwbs(awbInput)}><Plus size={15} /></Button>
        </div>
        {awbs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
            {awbs.map((awb) => (
              <span key={awb} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#1a78d420', color: '#60a5fa', fontSize: '12px', borderRadius: '9999px', padding: '3px 10px' }}>
                {awb}
                <button type="button" onClick={() => setAwbs((prev) => prev.filter((a) => a !== awb))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a6485', padding: 0, display: 'flex' }}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <Input label="Cliente" placeholder="Ex: Supersonic" value={cliente} onChange={(e) => setCliente(e.target.value)} required />
      <Button type="submit" loading={loading}>Registrar Retira</Button>
    </form>
  );
}

// ─── PRODUÇÃO ─────────────────────────────────────────────────────────────
function ProducaoTab({ shift }: { shift: 'A' | 'B' | 'C' }) {
  const { toast } = useToast();
  const [uldNumber, setUldNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uldErr = validateUld(uldNumber, true);
    if (uldErr) { toast({ type: 'error', title: 'ULD/Cart inválido', description: uldErr }); return; }
    if (!clientName.trim()) { toast({ type: 'error', title: 'Informe o cliente' }); return; }
    setLoading(true);
    try {
      await postLamina({ uldNumber, clientName, shift });
      toast({ type: 'success', title: 'Produção registrada!', description: `Cliente: ${clientName}` });
      setUldNumber(''); setClientName('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <Input label="Número da ULD/Cart" placeholder="Ex: PAG12345R7, PAG1234AD, LM12345 ou CAF1234" value={uldNumber} onChange={(e) => setUldNumber(e.target.value.toUpperCase())} required />
      <Input label="Nome do Cliente" placeholder="Ex: LATAM Cargo" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
      <Button type="submit" loading={loading}>Registrar Produção</Button>
    </form>
  );
}

// ─── VOLUMETRIA ───────────────────────────────────────────────────────────
function VolumetriaTab({ shift }: { shift: 'A' | 'B' | 'C' }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [direction, setDirection] = useState<'SAIDA' | 'CHEGADA'>('SAIDA');
  const [flightNumber, setFlightNumber] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const kg = parseFloat(pesoKg);
    if (isNaN(kg) || kg <= 0) {
      toast({ type: 'error', title: 'Peso inválido', description: 'Digite um valor maior que zero' });
      return;
    }
    setLoading(true);
    try {
      await postSaidaVoo({ flightNumber, shift, pesoKg: kg, direction });
      const label = direction === 'CHEGADA' ? 'Vôo recebido' : 'Vôo produzido';
      toast({ type: 'success', title: `${label} registrado!`, description: `Voo ${flightNumber} — ${kg} kg` });
      setFlightNumber(''); setPesoKg('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally { setLoading(false); }
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1.5px solid ${active ? '#1a78d4' : '#1e3355'}`,
    backgroundColor: active ? '#1a78d420' : '#0d1a30',
    color: active ? '#e2eafc' : '#7a9bc4',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#7a9bc4' }}>Tipo</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" style={tabBtn(direction === 'SAIDA')} onClick={() => setDirection('SAIDA')}>
            Saída (vôo produzido)
          </button>
          <button type="button" style={tabBtn(direction === 'CHEGADA')} onClick={() => setDirection('CHEGADA')}>
            Chegada (vôo recebido)
          </button>
        </div>
      </div>
      <Input label="Número do Voo" placeholder="Ex: AD1234" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} required />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#7a9bc4' }}>Peso total do voo (kg)</label>
        <input type="number" step="0.1" min="0.1" placeholder="Ex: 2500" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} required
          style={numberInputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
          onBlur={(e) => (e.target.style.borderColor = '#1e3355')} />
      </div>
      <div style={{ backgroundColor: '#0d1a30', border: '1px solid #1e3355', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#4a6485' }}>
        Registrado por: <span style={{ color: '#7a9bc4', fontWeight: 600 }}>{user?.username}</span>
      </div>
      <Button type="submit" loading={loading}>Registrar Volumetria</Button>
    </form>
  );
}

// ─── CONTINGENTE ──────────────────────────────────────────────────────────
function ContingenteTab({ shift }: { shift: 'A' | 'B' | 'C' }) {
  const { toast } = useToast();
  const [qtd, setQtd] = useState('');
  const [dia, setDia] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(qtd, 10);
    if (isNaN(n) || n <= 0) {
      toast({ type: 'error', title: 'Quantidade inválida', description: 'Inteiro maior que zero' });
      return;
    }
    setLoading(true);
    try {
      await postContingente({ shift, quantidadeTripulantes: n, dia });
      toast({ type: 'success', title: `Contingente registrado (turno ${shift})`, description: `${n} tripulante(s) em ${dia}` });
      setQtd('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#7a9bc4' }}>Dia</label>
        <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} required
          style={numberInputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
          onBlur={(e) => (e.target.style.borderColor = '#1e3355')} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#7a9bc4' }}>Quantidade de tripulantes (turno {shift})</label>
        <input type="number" min="1" step="1" placeholder="Ex: 8" value={qtd} onChange={(e) => setQtd(e.target.value)} required
          style={numberInputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
          onBlur={(e) => (e.target.style.borderColor = '#1e3355')} />
      </div>
      <div style={{ backgroundColor: '#0d1a30', border: '1px solid #1e3355', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#4a6485' }}>
        Apenas 1 registro por (dia, turno). Reenviar sobrescreve o valor anterior.
      </div>
      <Button type="submit" loading={loading}>Registrar Contingente</Button>
    </form>
  );
}

// ─── IMPORTAR PLANILHA ────────────────────────────────────────────────────
function ImportTab() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadTemplate();
      toast({ type: 'success', title: 'Template baixado', description: 'Abra o arquivo e preencha as 5 abas.' });
    } catch {
      toast({ type: 'error', title: 'Erro ao baixar template' });
    } finally {
      setDownloading(false);
    }
  }

  async function handleUpload() {
    if (!file) {
      toast({ type: 'error', title: 'Selecione um arquivo' });
      return;
    }
    setUploading(true);
    try {
      const res = await uploadExcel(file);
      setResult(res);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro no upload';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally {
      setUploading(false);
    }
  }

  function handleDownloadErrors() {
    if (result?.errorReportBase64) {
      downloadErrorReport(result.errorReportBase64);
    }
  }

  const totalCreated = result
    ? result.created.desembarques + result.created.retiras + result.created.producoes + result.created.volumetrias + result.created.contingentes
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#0d1a30', border: '1px solid #1e3355', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Download size={16} color="#60a5fa" />
            <strong style={{ color: '#e2eafc', fontSize: '14px' }}>1. Baixar template</strong>
          </div>
          <p style={{ color: '#4a6485', fontSize: '12px', margin: '0 0 14px' }}>
            Planilha com 5 abas (Desembarque, Retira, Produção, Volumetria, Contingente). Dropdowns nativos
            do Excel ajudam a preencher sem erros.
          </p>
          <Button onClick={handleDownload} loading={downloading} variant="secondary" size="sm" style={{ width: '100%' }}>
            Baixar template (.xlsx)
          </Button>
        </div>

        <div style={{ backgroundColor: '#0d1a30', border: '1px solid #1e3355', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Upload size={16} color="#60a5fa" />
            <strong style={{ color: '#e2eafc', fontSize: '14px' }}>2. Subir preenchido</strong>
          </div>
          <p style={{ color: '#4a6485', fontSize: '12px', margin: '0 0 14px' }}>
            Linhas válidas são criadas imediatamente. Linhas inválidas voltam marcadas em vermelho
            para você corrigir.
          </p>
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ display: 'block', marginBottom: '10px', color: '#7a9bc4', fontSize: '12px', width: '100%' }}
          />
          <Button onClick={handleUpload} loading={uploading} disabled={!file} size="sm" style={{ width: '100%' }}>
            <FileSpreadsheet size={14} /> Enviar
          </Button>
        </div>
      </div>

      {result && (
        <div style={{
          backgroundColor: '#0d1a30',
          border: `1px solid ${result.errors.length > 0 ? '#f59e0b40' : '#10b98140'}`,
          borderRadius: '10px',
          padding: '20px',
        }}>
          <h4 style={{ color: '#e2eafc', fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>
            Resultado da importação
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <ResultPill label="Desembarques" value={result.created.desembarques} />
            <ResultPill label="Retiras" value={result.created.retiras} />
            <ResultPill label="Produções" value={result.created.producoes} />
            <ResultPill label="Volumetrias" value={result.created.volumetrias} />
            <ResultPill label="Contingentes" value={result.created.contingentes} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#4a6485', fontSize: '13px' }}>
              <strong style={{ color: '#10b981' }}>{totalCreated}</strong> linha(s) importada(s) ·{' '}
              <strong style={{ color: result.errors.length > 0 ? '#f59e0b' : '#4a6485' }}>{result.errors.length}</strong> erro(s)
            </span>
            {result.errorReportBase64 && (
              <Button variant="secondary" size="sm" onClick={handleDownloadErrors}>
                <Download size={13} /> Baixar planilha com erros
              </Button>
            )}
          </div>

          {result.errors.length > 0 && <ErrorsTable errors={result.errors} />}
        </div>
      )}
    </div>
  );
}

function ResultPill({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      backgroundColor: value > 0 ? '#10b98115' : '#1e3355',
      border: `1px solid ${value > 0 ? '#10b98140' : '#1e3355'}`,
      borderRadius: '8px',
      padding: '10px',
      textAlign: 'center',
    }}>
      <div style={{ color: value > 0 ? '#10b981' : '#4a6485', fontSize: '20px', fontWeight: 700, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#4a6485', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function ErrorsTable({ errors }: { errors: ImportError[] }) {
  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #1e3355', borderRadius: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#162040', position: 'sticky', top: 0 }}>
            {['Aba', 'Linha', 'Campo', 'Valor', 'Motivo'].map((h) => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#7a9bc4', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {errors.map((e, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #162040' }}>
              <td style={{ padding: '6px 12px', color: '#e2eafc' }}>{e.sheet}</td>
              <td style={{ padding: '6px 12px', color: '#7a9bc4' }}>{e.row}</td>
              <td style={{ padding: '6px 12px', color: '#7a9bc4' }}>{e.field}</td>
              <td style={{ padding: '6px 12px', color: '#7a9bc4', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.value || '—'}</td>
              <td style={{ padding: '6px 12px', color: '#ef4444' }}>{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Página ────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'desembarque', label: 'Desembarque' },
  { value: 'retira', label: 'Retira' },
  { value: 'producao', label: 'Produção' },
  { value: 'volumetria', label: 'Volumetria' },
  { value: 'contingente', label: 'Contingente' },
  { value: 'importar', label: 'Importar Planilha' },
];

export function RegistrarPage() {
  const [shift, setShift] = useState<'A' | 'B' | 'C'>('A');

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h2 style={{ color: '#e2eafc', fontSize: '18px', fontWeight: 700, margin: 0 }}>Registrar Atividade</h2>
        <div style={{ position: 'relative' }}>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as 'A' | 'B' | 'C')}
            style={{ ...selectStyle, width: 'auto', padding: '6px 32px 6px 12px', fontSize: '13px', fontWeight: 600 }}
            onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e3355')}
          >
            <option value="A">Turno A</option>
            <option value="B">Turno B</option>
            <option value="C">Turno C</option>
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#4a6485', pointerEvents: 'none' }} />
        </div>
      </div>

      <Tabs.Root defaultValue="desembarque">
        <Tabs.List style={{ display: 'flex', gap: '4px', backgroundColor: '#0d1a30', borderRadius: '10px', padding: '4px', marginBottom: '16px', border: '1px solid #1e3355' }}>
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              style={{ flex: 1, padding: '8px 6px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: 'transparent', color: '#4a6485', transition: 'all 0.15s' }}
              className="data-[state=active]:!bg-[#1a78d4] data-[state=active]:!text-white hover:!text-[#7a9bc4]"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div style={cardStyle}>
          <Tabs.Content value="desembarque"><DesembarqueTab shift={shift} /></Tabs.Content>
          <Tabs.Content value="retira"><RetiraTab shift={shift} /></Tabs.Content>
          <Tabs.Content value="producao"><ProducaoTab shift={shift} /></Tabs.Content>
          <Tabs.Content value="volumetria"><VolumetriaTab shift={shift} /></Tabs.Content>
          <Tabs.Content value="contingente"><ContingenteTab shift={shift} /></Tabs.Content>
          <Tabs.Content value="importar"><ImportTab /></Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
