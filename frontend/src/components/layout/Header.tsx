import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { user } = useAuth();

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header style={{
      backgroundColor: '#0d1a30',
      borderBottom: '1px solid #1e3355',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 8px rgba(0,0,0,0.4)',
    }}>
      <div>
        <h1 style={{ color: '#e2eafc', fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '-0.2px' }}>
          TECAN — Realidade Operacional
        </h1>
        <p style={{ color: '#4a6485', fontSize: '12px', margin: '2px 0 0', textTransform: 'capitalize' }}>
          {dateStr}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%',
          backgroundColor: '#10b981',
          boxShadow: '0 0 6px #10b981',
        }} />
        <span style={{ color: '#7a9bc4', fontSize: '13px' }}>
          {user?.firstName} {user?.lastName}
        </span>
      </div>
    </header>
  );
}
