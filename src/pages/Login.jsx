import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { user, signInWithPassword, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      navigate('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      setMessage('Registrasi berhasil! Silakan periksa email Anda untuk verifikasi jika diaktifkan.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>HR Pagawe</h1>
          <p>Sistem Manajemen SDM Internal</p>
        </div>

        {error && <div className="login-error">{error}</div>}
        {message && <div className="login-message">{message}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Alamat Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Kata Sandi</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Memproses...' : (
              <>
                <LogIn size={18} style={{ marginRight: '8px' }} />
                Masuk
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Belum punya akun admin?{' '}
            <button 
              type="button" 
              onClick={handleSignUp}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500', padding: 0 }}
            >
              Daftar di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
