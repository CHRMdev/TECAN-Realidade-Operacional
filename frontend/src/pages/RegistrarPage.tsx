import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ChevronDown, X, Plus } from 'lucide-react';
import { postQuebra, postEntrega, postLamina, postSaidaVoo, postPeso } from '../api/atividades';
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

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#7a9bc4' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}
          onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
          onBlur={(e) => (e.target.style.borderColor = '#1e3355')}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4a6485', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

function QuebrasTab({ shift }: { shift: 'A' | 'B' | 'C' }) {
  const { toast } = useToast();
  const [flightNumber, setFlightNumber] = useState('');
  const [uldNumber, setUldNumber] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await postQuebra({ flightNumber, uldNumber, shift });
      toast({ type: 'success', title: 'Quebra registrada!', description: `Voo ${flightNumber} — ULD ${uldNumber}` });
      setFlightNumber(''); setUldNumber('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <Input label="Número do Voo" placeholder="Ex: AD1234" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} required />
      <Input label="Número da ULD" placeholder="Ex: PAG12345R7" value={uldNumber} onChange={(e) => setUldNumber(e.target.value.toUpperCase())} required />
      <Button type="submit" loading={loading}>Registrar Quebra</Button>
    </form>
  );
}

function EntregasTab({ shift }: { shift: 'A' | 'B' | 'C' }) {
  const { toast } = useToast();
  const [deliveryType, setDeliveryType] = useState('VOLUME');
  const [uldNumber, setUldNumber] = useState('');
  const [awbInput, setAwbInput] = useState('');
  const [awbs, setAwbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function addAwbs(raw: string) {
    const items = raw.split(/[,\s]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);
    setAwbs((prev) => [...prev, ...items.filter((a) => !prev.includes(a))]);
    setAwbInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!awbs.length) { toast({ type: 'error', title: 'Adicione ao menos 1 AWB' }); return; }
    setLoading(true);
    try {
      await postEntrega({ deliveryType: deliveryType as 'VOLUME' | 'LAMINA', uldNumber: deliveryType === 'LAMINA' ? uldNumber : undefined, awbs, shift });
      toast({ type: 'success', title: 'Entrega registrada!', description: `${awbs.length} AWB(s)` });
      setUldNumber(''); setAwbs([]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <SelectField label="Tipo de Entrega" value={deliveryType} onChange={setDeliveryType}
        options={[{ value: 'VOLUME', label: 'Volume' }, { value: 'LAMINA', label: 'Lâmina' }]} />
      {deliveryType === 'LAMINA' && (
        <Input label="Número da Lâmina (ULD)" placeholder="Ex: PAG12345R7" value={uldNumber} onChange={(e) => setUldNumber(e.target.value.toUpperCase())} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#7a9bc4' }}>AWBs</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="Digite ou cole AWBs (separe por vírgula)" value={awbInput}
            onChange={(e) => setAwbInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAwbs(awbInput); } }}
            style={{ flex: 1, padding: '10px 14px', fontSize: '14px', backgroundColor: '#0d1a30', border: '1.5px solid #1e3355', borderRadius: '8px', color: '#e2eafc', outline: 'none' }}
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
      <Button type="submit" loading={loading}>Registrar Entrega</Button>
    </form>
  );
}

function LaminaTab({ shift }: { shift: 'A' | 'B' | 'C' }) {
  const { toast } = useToast();
  const [uldNumber, setUldNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await postLamina({ uldNumber, clientName, shift });
      toast({ type: 'success', title: 'Lâmina registrada!', description: `Cliente: ${clientName}` });
      setUldNumber(''); setClientName('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <Input label="Número da Lâmina (ULD)" placeholder="Ex: PAG12345R7" value={uldNumber} onChange={(e) => setUldNumber(e.target.value.toUpperCase())} required />
      <Input label="Nome do Cliente" placeholder="Ex: LATAM Cargo" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
      <Button type="submit" loading={loading}>Registrar Lâmina</Button>
    </form>
  );
}

function SaidaVooTab({ shift }: { shift: 'A' | 'B' | 'C' }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flightNumber, setFlightNumber] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await postSaidaVoo({ flightNumber, shift });
      toast({ type: 'success', title: 'Saída registrada!', description: `Voo ${flightNumber}` });
      setFlightNumber('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <Input label="Número do Voo" placeholder="Ex: AD1234" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} required />
      <div style={{ backgroundColor: '#0d1a30', border: '1px solid #1e3355', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#4a6485' }}>
        Registrado por: <span style={{ color: '#7a9bc4', fontWeight: 600 }}>{user?.username}</span>
      </div>
      <Button type="submit" loading={loading}>Registrar Saída</Button>
    </form>
  );
}

function PesoTab({ shift }: { shift: 'A' | 'B' | 'C' }) {
  const { toast } = useToast();
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
      await postPeso({ pesoKg: kg, shift });
      toast({ type: 'success', title: 'Peso registrado!', description: `${kg} kg — Turno ${shift}` });
      setPesoKg('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#7a9bc4' }}>
          Peso Movimentado (kg)
        </label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          placeholder="Ex: 1523.5"
          value={pesoKg}
          onChange={(e) => setPesoKg(e.target.value)}
          required
          style={{
            padding: '10px 14px',
            fontSize: '14px',
            backgroundColor: '#0d1a30',
            border: '1.5px solid #1e3355',
            borderRadius: '8px',
            color: '#e2eafc',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
          onBlur={(e) => (e.target.style.borderColor = '#1e3355')}
        />
        <p style={{ fontSize: '12px', color: '#4a6485', margin: 0 }}>
          Total de kg movimentados no turno
        </p>
      </div>
      <Button type="submit" loading={loading}>Registrar Peso</Button>
    </form>
  );
}

const TABS = [
  { value: 'quebra', label: 'Quebra' },
  { value: 'entrega', label: 'Entrega' },
  { value: 'lamina', label: 'Lâmina' },
  { value: 'saida', label: 'Saída de Voo' },
  { value: 'peso', label: 'Peso' },
];

export function RegistrarPage() {
  const [shift, setShift] = useState<'A' | 'B' | 'C'>('A');

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
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

      <Tabs.Root defaultValue="quebra">
        <Tabs.List style={{ display: 'flex', gap: '4px', backgroundColor: '#0d1a30', borderRadius: '10px', padding: '4px', marginBottom: '16px', border: '1px solid #1e3355' }}>
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              style={{ flex: 1, padding: '8px 8px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: 'transparent', color: '#4a6485', transition: 'all 0.15s' }}
              className="data-[state=active]:!bg-[#1a78d4] data-[state=active]:!text-white hover:!text-[#7a9bc4]"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div style={cardStyle}>
          <Tabs.Content value="quebra"><QuebrasTab shift={shift} /></Tabs.Content>
          <Tabs.Content value="entrega"><EntregasTab shift={shift} /></Tabs.Content>
          <Tabs.Content value="lamina"><LaminaTab shift={shift} /></Tabs.Content>
          <Tabs.Content value="saida"><SaidaVooTab shift={shift} /></Tabs.Content>
          <Tabs.Content value="peso"><PesoTab shift={shift} /></Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
