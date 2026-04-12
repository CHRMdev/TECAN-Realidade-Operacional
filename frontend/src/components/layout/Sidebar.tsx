import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, LogOut, Shield } from 'lucide-react';
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
    <aside
      className="w-56 shrink-0 flex flex-col min-h-screen"
      style={{ background: 'linear-gradient(180deg, #003a7a 0%, #004494 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <p className="text-blue-300 text-xs font-bold tracking-[0.18em] uppercase mb-0.5">
          Azul Cargo
        </p>
        <p className="text-white text-xl font-black tracking-tight">TECAN</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-white' : 'text-blue-300'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Shield size={17} className={isActive ? 'text-white' : 'text-blue-300'} />
                Admin
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-4 mb-3">
          <p className="text-blue-400 text-xs">Logado como</p>
          <p className="text-white text-sm font-semibold truncate">{user?.username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  );
}
