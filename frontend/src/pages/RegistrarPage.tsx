import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, X, Plus } from 'lucide-react';
import { postQuebra, postEntrega, postLamina, postSaidaVoo } from '../api/atividades';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

function getCurrentShift(): string {
  const now = new Date();
  // UTC-3
  const hour = (now.getUTCHours() - 3 + 24) % 24;
  if (hour >= 23 || hour < 7) return 'A';
  if (hour < 15) return 'B';
  return 'C';
}

function QuebrasTab() {
  const { toast } = useToast();
  const [flightNumber, setFlightNumber] = useState('');
  const [uldNumber, setUldNumber] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await postQuebra({ flightNumber, uldNumber });
      toast({ type: 'success', title: 'Quebra registrada!', description: `Voo ${flightNumber} — ULD ${uldNumber}` });
      setFlightNumber('');
      setUldNumber('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <Input label="Número do Voo" placeholder="Ex: AD1234" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} required />
      <Input label="Número da ULD" placeholder="Ex: PAG12345R7" value={uldNumber} onChange={(e) => setUldNumber(e.target.value.toUpperCase())} required />
      <Button type="submit" loading={loading}>Registrar Quebra</Button>
    </form>
  );
}

function EntregasTab() {
  const { toast } = useToast();
  const [deliveryType, setDeliveryType] = useState<'VOLUME' | 'LAMINA'>('VOLUME');
  const [uldNumber, setUldNumber] = useState('');
  const [awbInput, setAwbInput] = useState('');
  const [awbs, setAwbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function addAwbs(raw: string) {
    const items = raw.split(/[,\s]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);
    setAwbs((prev) => [...prev, ...items.filter((a) => !prev.includes(a))]);
    setAwbInput('');
  }

  function handleAwbKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addAwbs(awbInput); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!awbs.length) { toast({ type: 'error', title: 'Adicione ao menos 1 AWB' }); return; }
    setLoading(true);
    try {
      await postEntrega({ deliveryType, uldNumber: deliveryType === 'LAMINA' ? uldNumber : undefined, awbs });
      toast({ type: 'success', title: 'Entrega registrada!', description: `${awbs.length} AWB(s)` });
      setUldNumber('');
      setAwbs([]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Tipo de Entrega</label>
        <Select.Root value={deliveryType} onValueChange={(v) => setDeliveryType(v as 'VOLUME' | 'LAMINA')}>
          <Select.Trigger className="flex items-center justify-between w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors cursor-pointer">
            <Select.Value />
            <Select.Icon><ChevronDown size={16} className="text-slate-400" /></Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <Select.Viewport>
                <Select.Item value="VOLUME" className="px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 cursor-pointer outline-none">
                  <Select.ItemText>Volume</Select.ItemText>
                </Select.Item>
                <Select.Item value="LAMINA" className="px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 cursor-pointer outline-none">
                  <Select.ItemText>Lâmina</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {deliveryType === 'LAMINA' && (
        <Input label="Número da Lâmina (ULD)" placeholder="Ex: PAG12345R7" value={uldNumber} onChange={(e) => setUldNumber(e.target.value.toUpperCase())} />
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">AWBs</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Digite ou cole AWBs (separe por vírgula)"
            value={awbInput}
            onChange={(e) => setAwbInput(e.target.value)}
            onKeyDown={handleAwbKeyDown}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => addAwbs(awbInput)}>
            <Plus size={16} />
          </Button>
        </div>
        {awbs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {awbs.map((awb) => (
              <span key={awb} className="inline-flex items-center gap-1 bg-slate-700 text-slate-200 text-xs rounded-full px-2.5 py-1">
                {awb}
                <button type="button" onClick={() => setAwbs((prev) => prev.filter((a) => a !== awb))}>
                  <X size={12} className="text-slate-400 hover:text-red-400" />
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

function LaminaTab() {
  const { toast } = useToast();
  const [uldNumber, setUldNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await postLamina({ uldNumber, clientName });
      toast({ type: 'success', title: 'Lâmina registrada!', description: `Cliente: ${clientName}` });
      setUldNumber('');
      setClientName('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <Input label="Número da Lâmina (ULD)" placeholder="Ex: PAG12345R7" value={uldNumber} onChange={(e) => setUldNumber(e.target.value.toUpperCase())} required />
      <Input label="Nome do Cliente" placeholder="Ex: LATAM Cargo" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
      <Button type="submit" loading={loading}>Registrar Lâmina</Button>
    </form>
  );
}

function SaidaVooTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flightNumber, setFlightNumber] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await postSaidaVoo({ flightNumber });
      toast({ type: 'success', title: 'Saída registrada!', description: `Voo ${flightNumber}` });
      setFlightNumber('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar';
      toast({ type: 'error', title: 'Erro', description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <Input label="Número do Voo" placeholder="Ex: AD1234" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} required />
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400">
        Registrado por: <span className="text-slate-200 font-medium">{user?.username}</span>
      </div>
      <Button type="submit" loading={loading}>Registrar Saída</Button>
    </form>
  );
}

const TABS = [
  { value: 'quebra', label: 'Quebra (Desembarque)' },
  { value: 'entrega', label: 'Entrega' },
  { value: 'lamina', label: 'Lâmina Produzida' },
  { value: 'saida', label: 'Saída de Voo' },
];

export function RegistrarPage() {
  const shift = getCurrentShift();
  const shiftColors: Record<string, 'blue' | 'green' | 'orange'> = { A: 'blue', B: 'green', C: 'orange' };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-slate-100">Registrar Atividade</h2>
        <Badge variant={shiftColors[shift]}>Turno {shift}</Badge>
      </div>

      <Tabs.Root defaultValue="quebra">
        <Tabs.List className="flex gap-1 bg-slate-800 rounded-xl p-1 mb-6">
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:text-slate-200"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <Tabs.Content value="quebra"><QuebrasTab /></Tabs.Content>
          <Tabs.Content value="entrega"><EntregasTab /></Tabs.Content>
          <Tabs.Content value="lamina"><LaminaTab /></Tabs.Content>
          <Tabs.Content value="saida"><SaidaVooTab /></Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
