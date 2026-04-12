import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';

const schema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').regex(/^[a-zA-ZÀ-ú]+$/, 'Apenas letras'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').regex(/^[a-zA-ZÀ-ú]+$/, 'Apenas letras'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '14px',
  border: '1.5px solid #e5e7eb',
  borderRadius: '8px',
  outline: 'none',
  backgroundColor: '#f9fafb',
  color: '#111827',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.15s',
};

const inputErrorStyle = { ...inputStyle, borderColor: '#fca5a5', backgroundColor: '#fff7f7' };
const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' };
const errorTextStyle = { fontSize: '12px', color: '#dc2626', marginTop: '4px' };

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
            padding: '32px 32px 28px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#93c5fd', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              ✦ Azul Cargo Express ✦
            </p>
            <h1 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
              Criar Conta
            </h1>
            <div style={{ width: '32px', height: '2px', background: '#60a5fa', margin: '0 auto 8px' }} />
            <p style={{ color: '#bfdbfe', fontSize: '12px', margin: 0, fontWeight: 500 }}>
              TECAN · Realidade Operacional
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: '28px 32px 32px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label style={labelStyle}>Primeiro Nome</label>
                <input
                  type="text"
                  placeholder="Caio"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={errors.firstName ? inputErrorStyle : inputStyle}
                  onFocus={(e) => { if (!errors.firstName) e.target.style.borderColor = '#005eb8'; }}
                  onBlur={(e) => { if (!errors.firstName) e.target.style.borderColor = '#e5e7eb'; }}
                />
                {errors.firstName && <p style={errorTextStyle}>{errors.firstName}</p>}
              </div>

              <div>
                <label style={labelStyle}>Sobrenome</label>
                <input
                  type="text"
                  placeholder="Henrique"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={errors.lastName ? inputErrorStyle : inputStyle}
                  onFocus={(e) => { if (!errors.lastName) e.target.style.borderColor = '#005eb8'; }}
                  onBlur={(e) => { if (!errors.lastName) e.target.style.borderColor = '#e5e7eb'; }}
                />
                {errors.lastName && <p style={errorTextStyle}>{errors.lastName}</p>}
              </div>

              <div>
                <label style={labelStyle}>Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={errors.password ? inputErrorStyle : inputStyle}
                  onFocus={(e) => { if (!errors.password) e.target.style.borderColor = '#005eb8'; }}
                  onBlur={(e) => { if (!errors.password) e.target.style.borderColor = '#e5e7eb'; }}
                />
                {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
              </div>

              {usernamePreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    fontSize: '13px',
                    color: '#1e40af',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                >
                  Usuário:{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#005eb8' }}>
                    {usernamePreview}
                  </span>
                </motion.div>
              )}

              {apiError && (
                <div style={{
                  fontSize: '13px',
                  color: '#b91c1c',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}>
                  {apiError}
                </div>
              )}

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
                  boxShadow: '0 4px 14px rgba(0,94,184,0.4)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? 'Criando...' : 'Criar Conta'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '20px', marginBottom: 0 }}>
              Já tem conta?{' '}
              <Link to="/login" style={{ color: '#005eb8', fontWeight: 600, textDecoration: 'none' }}>
                Entrar
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#93c5fd', fontSize: '11px', marginTop: '20px', opacity: 0.7 }}>
          Viracopos · Terminal de Cargas
        </p>
      </motion.div>
    </div>
  );
}
