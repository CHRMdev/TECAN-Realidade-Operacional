import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import {
  getAdminUsers,
  changeUserRole,
  resetUserPassword,
  getAdminRecords,
  deleteRecord,
  bulkDeleteRecords,
} from '../api/admin';
import type { AdminUser, AdminRecord } from '../api/admin';

// ─── Styles ────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  backgroundColor: '#111e35',
  border: '1px solid #1e3355',
  borderRadius: '12px',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: '#0d1a30',
  border: '1.5px solid #1e3355',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#e2eafc',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  backgroundColor: '#0d1a30',
  border: '1.5px solid #1e3355',
  borderRadius: '8px',
  padding: '8px 32px 8px 12px',
  fontSize: '13px',
  color: '#e2eafc',
  outline: 'none',
  appearance: 'none',
  cursor: 'pointer',
};

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left' as const,
  fontSize: '11px',
  fontWeight: 600,
  color: '#4a6485',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #162040',
  color: '#7a9bc4',
  fontSize: '13px',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

const TYPE_LABELS: Record<string, string> = {
  quebra: 'Desembarque',
  entrega: 'Retira',
  lamina: 'Produção',
  saida_voo: 'Volumetria',
  peso: 'Peso (legado)',
  contingente: 'Contingente',
};
const TYPE_BADGE: Record<string, 'warning' | 'success' | 'info' | 'sage' | 'default'> = {
  quebra: 'warning', entrega: 'success', lamina: 'info', saida_voo: 'sage', peso: 'default', contingente: 'info',
};
const SHIFT_BADGE: Record<string, 'info' | 'success' | 'warning'> = {
  A: 'info', B: 'success', C: 'warning',
};

const TYPES = [
  { value: '', label: 'Todos' },
  { value: 'quebra', label: 'Desembarque' },
  { value: 'entrega', label: 'Retira' },
  { value: 'lamina', label: 'Produção' },
  { value: 'saida_voo', label: 'Volumetria' },
  { value: 'contingente', label: 'Contingente' },
  { value: 'peso', label: 'Peso (legado)' },
];

function getRecordKey(item: AdminRecord): string {
  return `${item.type}:${(item.data as Record<string, unknown>).id as string}`;
}

function getDetail(item: AdminRecord): string {
  const d = item.data as Record<string, unknown>;
  if (item.type === 'quebra') return `Voo ${d.flightNumber} | ULD ${d.uldNumber}`;
  if (item.type === 'entrega') {
    const awbs = (d.awbs as Array<{ awbNumber: string }> | undefined) ?? [];
    return `${d.deliveryType}${d.uldNumber ? ` | ULD ${d.uldNumber}` : ''} | ${awbs.length} AWB(s)`;
  }
  if (item.type === 'lamina') return `ULD ${d.uldNumber} | Cliente: ${d.clientName}`;
  if (item.type === 'saida_voo') {
    const peso = d.pesoKg as number | null | undefined;
    return `Voo ${d.flightNumber}${peso ? ` | ${peso} kg` : ''}`;
  }
  if (item.type === 'peso') return `${d.pesoKg} kg | Turno ${d.shift}`;
  if (item.type === 'contingente') return `${d.quantidadeTripulantes} tripulante(s)`;
  return '';
}

// ─── UsersTab ──────────────────────────────────────────────────────────────

function UsersTab({ currentUserId }: { currentUserId: string }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    getAdminUsers()
      .then((res) => setUsers(res.data))
      .catch(() => toast({ type: 'error', title: 'Erro ao carregar usuários' }))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggleRole(user: AdminUser) {
    const newRole = user.role === 'operator' ? 'admin' : 'operator';
    try {
      await changeUserRole(user.id, newRole);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
      toast({ type: 'success', title: `Role de ${user.username} alterado para ${newRole}` });
    } catch {
      toast({ type: 'error', title: 'Erro ao alterar role' });
    }
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      await resetUserPassword(resetTarget.id, newPassword);
      toast({ type: 'success', title: `Senha de ${resetTarget.username} redefinida` });
      setResetTarget(null);
      setNewPassword('');
    } catch {
      toast({ type: 'error', title: 'Erro ao redefinir senha' });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div style={cardStyle}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e3355' }}>
              {['Usuário', 'Nome', 'Role', 'Criado em', 'Ações'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{ borderBottom: '1px solid #162040', transition: 'background 0.1s' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#162040')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ ...tdStyle, color: '#e2eafc', fontWeight: 600 }}>{user.username}</td>
                <td style={tdStyle}>{user.firstName} {user.lastName}</td>
                <td style={tdStyle}>
                  {user.role === 'admin' ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      backgroundColor: '#1a78d420', color: '#60a5fa',
                    }}>Admin</span>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      backgroundColor: '#1e3355', color: '#4a6485',
                    }}>Operador</span>
                  )}
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setResetTarget(user); setNewPassword(''); }}
                    >
                      Resetar Senha
                    </Button>
                    <div title={currentUserId === user.id ? 'Você não pode alterar seu próprio role' : ''}>
                      <Button
                        variant={user.role === 'operator' ? 'primary' : 'secondary'}
                        size="sm"
                        disabled={currentUserId === user.id}
                        onClick={() => handleToggleRole(user)}
                      >
                        {user.role === 'operator' ? 'Tornar Admin' : 'Tornar Operador'}
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de Reset Senha */}
      {resetTarget && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ ...cardStyle, padding: '24px', width: '360px' }}>
            <h3 style={{ color: '#e2eafc', margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>
              Resetar Senha
            </h3>
            <p style={{ color: '#4a6485', fontSize: '13px', margin: '0 0 16px' }}>
              Usuário: <span style={{ color: '#7a9bc4' }}>{resetTarget.username}</span>
            </p>
            <input
              type="password"
              placeholder="Nova senha (mínimo 6 caracteres)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setResetTarget(null); setNewPassword(''); }}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid #1e3355',
                  backgroundColor: 'transparent', color: '#7a9bc4', cursor: 'pointer', fontSize: '13px',
                }}
              >
                Cancelar
              </button>
              <button
                disabled={newPassword.length < 6 || resetting}
                onClick={handleResetPassword}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: newPassword.length < 6 ? '#1e3355' : '#1a78d4',
                  color: newPassword.length < 6 ? '#4a6485' : 'white',
                  cursor: newPassword.length < 6 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600,
                }}
              >
                {resetting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RecordsTab ────────────────────────────────────────────────────────────

function RecordsTab() {
  const { toast } = useToast();
  const { from: initFrom, to: initTo } = getMonthRange();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [pagination, setPagination] = useState<{ page: number; totalPages: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const [typeFilter, setTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [from, setFrom] = useState(initFrom);
  const [to, setTo] = useState(initTo);
  const [page, setPage] = useState(1);

  const fetchRecords = useCallback(async (
    p: number, type: string, userId: string, f: string, t: string
  ) => {
    setLoading(true);
    try {
      const res = await getAdminRecords({
        page: p, limit: 20,
        type: type || undefined,
        userId: userId || undefined,
        from: f, to: t,
      });
      setRecords(res.data);
      setPagination(res.pagination);
    } catch {
      toast({ type: 'error', title: 'Erro ao carregar registros' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    getAdminUsers()
      .then((res) => setUsers(res.data))
      .catch(() => {});
    fetchRecords(1, '', '', initFrom, initTo);
  }, []);

  function handleFilter() {
    setPage(1);
    setSelected(new Set());
    fetchRecords(1, typeFilter, userFilter, from, to);
  }

  function handlePage(p: number) {
    setPage(p);
    setSelected(new Set());
    fetchRecords(p, typeFilter, userFilter, from, to);
  }

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    const allKeys = records.map(getRecordKey);
    const allSelected = allKeys.every((k) => selected.has(k));
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allKeys));
    }
  }

  async function handleDeleteRecord(item: AdminRecord) {
    const id = (item.data as Record<string, unknown>).id as string;
    try {
      await deleteRecord(item.type, id);
      toast({ type: 'success', title: 'Registro deletado' });
      fetchRecords(page, typeFilter, userFilter, from, to);
    } catch {
      toast({ type: 'error', title: 'Erro ao deletar registro' });
    }
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Confirmar exclusão de ${selected.size} registro(s)?`)) return;
    setDeleting(true);
    try {
      const toDelete = [...selected].map((key) => {
        const [type, id] = key.split(':');
        return { type, id };
      });
      await bulkDeleteRecords(toDelete);
      setSelected(new Set());
      toast({ type: 'success', title: `${toDelete.length} registro(s) deletado(s)` });
      fetchRecords(page, typeFilter, userFilter, from, to);
    } catch {
      toast({ type: 'error', title: 'Erro ao deletar registros' });
    } finally {
      setDeleting(false);
    }
  }

  const allKeys = records.map(getRecordKey);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filtros */}
      <div style={{ ...cardStyle, padding: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '12px' }}>
        {/* Tipo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a6485', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tipo
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ ...selectStyle, minWidth: '140px' }}
            >
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#4a6485', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Usuário */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a6485', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Usuário
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={{ ...selectStyle, minWidth: '160px' }}
            >
              <option value="">Todos</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#4a6485', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* De */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a6485', textTransform: 'uppercase', letterSpacing: '0.05em' }}>De</label>
          <input
            type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e3355')}
          />
        </div>

        {/* Até */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a6485', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Até</label>
          <input
            type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#1a78d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e3355')}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <Button onClick={handleFilter} loading={loading}>Filtrar</Button>

          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                cursor: deleting ? 'not-allowed' : 'pointer',
                backgroundColor: '#ef444420', color: '#ef4444', border: '1px solid #ef444440',
              }}
            >
              {deleting ? 'Deletando...' : `Deletar selecionados (${selected.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <Spinner className="h-8 w-8" />
          </div>
        ) : !records.length ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', color: '#4a6485', fontSize: '14px' }}>
            Nenhum registro encontrado
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e3355' }}>
                <th style={{ ...thStyle, width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#1a78d4' }}
                  />
                </th>
                {['Tipo', 'Usuário', 'Turno', 'Detalhes', 'Data', 'Ação'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((item, i) => {
                const d = item.data as Record<string, unknown>;
                const shift = d.shift as string;
                const username = (d.user as Record<string, unknown> | undefined)?.username as string | undefined
                  ?? (d.username as string | undefined)
                  ?? '—';
                const key = getRecordKey(item);
                const isSelected = selected.has(key);

                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid #162040',
                      transition: 'background 0.1s',
                      backgroundColor: isSelected ? '#162040' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#162040'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ ...tdStyle, width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(key)}
                        style={{ cursor: 'pointer', accentColor: '#1a78d4' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #162040' }}>
                      <Badge variant={TYPE_BADGE[item.type] ?? 'default'}>{TYPE_LABELS[item.type] ?? item.type}</Badge>
                    </td>
                    <td style={tdStyle}>{username}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #162040' }}>
                      {shift && <Badge variant={SHIFT_BADGE[shift] ?? 'default'}>Turno {shift}</Badge>}
                    </td>
                    <td style={tdStyle}>{getDetail(item)}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      {new Date(item.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ ...tdStyle, width: '48px' }}>
                      <button
                        onClick={() => handleDeleteRecord(item)}
                        title="Deletar registro"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                          backgroundColor: '#ef444420', color: '#ef4444', cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ef444440')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef444420')}
                      >
                        <X size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#4a6485' }}>
          <span>Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => handlePage(page - 1)}>
              <ChevronLeft size={14} /> Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={page === pagination.totalPages} onClick={() => handlePage(page + 1)}>
              Próximo <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AdminPage ─────────────────────────────────────────────────────────────

export function AdminPage() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <h2 style={{ color: '#e2eafc', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
        Painel Admin
      </h2>
      <Tabs.Root defaultValue="users">
        <Tabs.List style={{
          display: 'flex', gap: '4px', backgroundColor: '#0d1a30',
          borderRadius: '10px', padding: '4px', marginBottom: '16px', border: '1px solid #1e3355',
        }}>
          <Tabs.Trigger
            value="users"
            style={{
              flex: 1, padding: '8px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', backgroundColor: 'transparent', color: '#4a6485', transition: 'all 0.15s',
            }}
            className="data-[state=active]:!bg-[#1a78d4] data-[state=active]:!text-white hover:!text-[#7a9bc4]"
          >
            Usuários
          </Tabs.Trigger>
          <Tabs.Trigger
            value="records"
            style={{
              flex: 1, padding: '8px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', backgroundColor: 'transparent', color: '#4a6485', transition: 'all 0.15s',
            }}
            className="data-[state=active]:!bg-[#1a78d4] data-[state=active]:!text-white hover:!text-[#7a9bc4]"
          >
            Registros
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="users">
          <UsersTab currentUserId={user.id} />
        </Tabs.Content>
        <Tabs.Content value="records">
          <RecordsTab />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
