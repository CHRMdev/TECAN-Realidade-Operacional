import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { user } = useAuth();

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-slate-100">TECAN — Realidade Operacional</h1>
        <p className="text-sm text-slate-400 capitalize">{dateStr}</p>
      </div>
      <div className="text-sm text-slate-400">
        Olá, <span className="font-medium text-slate-200">{user?.firstName}</span>
      </div>
    </header>
  );
}
