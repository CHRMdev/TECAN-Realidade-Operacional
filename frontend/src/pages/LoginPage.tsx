import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Credenciais inválidas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-1">Azul Cargo Express</p>
          <h1 className="text-2xl font-bold text-slate-100">TECAN</h1>
          <p className="text-slate-400 text-sm mt-1">Realidade Operacional</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
          <Input
            label="Usuário"
            type="text"
            placeholder="caio.henrique"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Não tem conta?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            Registre-se
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
