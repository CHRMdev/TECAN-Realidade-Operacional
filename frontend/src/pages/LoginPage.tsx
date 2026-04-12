import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'linear-gradient(135deg, #002d6b 0%, #005eb8 60%, #1a7fd4 100%)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '380px' }}
      >
        {/* Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(180deg, #005eb8 0%, #003a7a 100%)',
            padding: '40px 32px 36px',
            textAlign: 'center',
          }}>
            <p style={{
              color: '#93c5fd',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '12px',
              margin: '0 0 12px 0',
            }}>
              ✦ Azul Cargo Express ✦
            </p>
            <h1 style={{
              color: '#ffffff',
              fontSize: '48px',
              fontWeight: 900,
              letterSpacing: '-1px',
              lineHeight: 1,
              margin: '0 0 10px 0',
            }}>
              TECAN
            </h1>
            <div style={{ width: '40px', height: '2px', background: '#60a5fa', margin: '0 auto 10px' }} />
            <p style={{
              color: '#bfdbfe',
              fontSize: '13px',
              fontWeight: 500,
              margin: 0,
              letterSpacing: '0.05em',
            }}>
              Realidade Operacional
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: '32px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Username */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Usuário
                </label>
                <input
                  type="text"
                  placeholder="seu.usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: '#f9fafb',
                    color: '#111827',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#005eb8')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: '#f9fafb',
                    color: '#111827',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#005eb8')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: '13px',
                    color: '#b91c1c',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: loading ? '#60a5fa' : 'linear-gradient(135deg, #005eb8, #004494)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 14px rgba(0,94,184,0.4)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.currentTarget.style.transform = 'translateY(-1px)');
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget.style.transform = 'translateY(0)');
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '20px', marginBottom: 0 }}>
              Não tem conta?{' '}
              <Link
                to="/register"
                style={{ color: '#005eb8', fontWeight: 600, textDecoration: 'none' }}
              >
                Registre-se
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#93c5fd', fontSize: '11px', marginTop: '20px', opacity: 0.7 }}>
          Viracopos · Terminal de Cargas
        </p>
      </motion.div>
    </div>
  );
}
