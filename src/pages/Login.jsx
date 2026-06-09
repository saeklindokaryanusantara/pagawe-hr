import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { user, signInWithPassword, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await signUp({ email, password });
        if (error) throw error;
        setMessage('Registrasi berhasil! Silakan coba login sekarang.');
        setMode('login'); // Switch back to login mode
        setPassword(''); // Clear password for safety
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setMessage('Tautan reset password telah dikirim ke email Anda! (Periksa folder Spam jika tidak ada)');
        setMode('login');
      } else {
        const { error } = await signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
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
          <img 
            src="/logo.png" 
            alt="Company Logo" 
            style={{ 
              height: '70px', 
              objectFit: 'contain', 
              margin: '0 auto 1.5rem auto', 
              display: 'block',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
            }} 
          />
          <p style={{ fontSize: '1.1rem', fontWeight: '500', color: '#e2e8f0', lineHeight: '1.5', padding: '0 10px' }}>
            {mode === 'reset' ? 'Reset Kata Sandi Anda' : (
              <>
                Sistem Manajemen SDM Internal<br />
                <span style={{ fontWeight: '600', color: '#ffffff', fontSize: '0.95rem' }}>PT. Saeklindo Karya Nusantara</span>
              </>
            )}
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}
        {message && <div className="login-message">{message}</div>}

        <form onSubmit={handleSubmit}>
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

          {mode !== 'reset' && (
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
              {mode === 'login' && (
                <button 
                  type="button" 
                  className="forgot-password-link"
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                    setMessage(null);
                  }}
                >
                  Lupa Password?
                </button>
              )}
            </div>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Memproses...' : (
              <>
                {mode === 'signup' && <><UserPlus size={18} style={{ marginRight: '8px' }} /> Daftar Akun</>}
                {mode === 'login' && <><LogIn size={18} style={{ marginRight: '8px' }} /> Masuk</>}
                {mode === 'reset' && <><KeyRound size={18} style={{ marginRight: '8px' }} /> Kirim Tautan Reset</>}
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          {mode === 'reset' ? (
            <button 
              type="button" 
              onClick={() => {
                setMode('login');
                setError(null);
                setMessage(null);
              }}
              className="signup-link"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '0 auto' }}
            >
              <ArrowLeft size={16} /> Kembali ke Login
            </button>
          ) : (
            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
              {mode === 'signup' ? 'Sudah punya akun?' : 'Belum punya akun admin?'}
              {' '}
              <button 
                type="button" 
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setMessage(null);
                }}
                className="signup-link"
              >
                {mode === 'signup' ? 'Masuk di sini' : 'Daftar di sini'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
