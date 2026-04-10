import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const schema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').regex(/^[a-zA-ZÀ-ú]+$/, 'Apenas letras'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').regex(/^[a-zA-ZÀ-ú]+$/, 'Apenas letras'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const usernamePreview =
    firstName && lastName
      ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');

    const result = schema.safeParse({ firstName, lastName, password });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errs[issue.path[0] as string] = issue.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await register(firstName, lastName, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erro ao criar conta';
      setApiError(msg);
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
          <h1 className="text-2xl font-bold text-slate-100">Criar Conta</h1>
          <p className="text-slate-400 text-sm mt-1">TECAN — Realidade Operacional</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
          <Input
            label="Primeiro Nome"
            type="text"
            placeholder="Caio"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Sobrenome"
            type="text"
            placeholder="Henrique"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          {usernamePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-sm text-slate-400 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
            >
              Seu usuário será:{' '}
              <span className="font-mono text-blue-400 font-semibold">{usernamePreview}</span>
            </motion.div>
          )}

          {apiError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2"
            >
              {apiError}
            </motion.p>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
            Criar Conta
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Já tem conta?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
