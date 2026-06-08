import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { user, signInWithPassword, signUp } = useAuth();
  const navigate = useNavigate();
  
  const [isSignUpMode, setIsSignUpMode] = useState(false);
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
      if (isSignUpMode) {
        const { error } = await signUp({ email, password });
        if (error) throw error;
        setMessage('Registrasi berhasil! Silakan coba login sekarang.');
        setIsSignUpMode(false); // Switch back to login mode
        setPassword(''); // Clear password for safety
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
          <h1>Pagawe</h1>
          <p>Sistem Manajemen SDM Internal</p>
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
                {isSignUpMode ? (
                  <><UserPlus size={18} style={{ marginRight: '8px' }} /> Daftar Akun</>
                ) : (
                  <><LogIn size={18} style={{ marginRight: '8px' }} /> Masuk</>
                )}
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isSignUpMode ? 'Sudah punya akun?' : 'Belum punya akun admin?'}
            {' '}
            <button 
              type="button" 
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setError(null);
                setMessage(null);
              }}
              className="signup-link"
            >
              {isSignUpMode ? 'Masuk di sini' : 'Daftar di sini'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
