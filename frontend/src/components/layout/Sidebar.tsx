import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/registrar', icon: PlusCircle, label: 'Registrar' },
  { to: '/historico', icon: History, label: 'Histórico' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-slate-800">
        <p className="text-xs font-bold tracking-widest text-blue-400 uppercase">Azul Cargo</p>
        <p className="text-sm font-semibold text-slate-200 mt-0.5">TECAN</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800">
        <div className="px-3 mb-2">
          <p className="text-xs text-slate-500">Logado como</p>
          <p className="text-sm text-slate-300 font-medium">{user?.username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
