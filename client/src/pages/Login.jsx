import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';
import { useToast } from '../components/ToastContext.jsx';
import styles from './Auth.module.css';

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.token);
      showToast('Logged in successfully.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      showToast(err.response?.data?.message || 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.card}>
        <div className={styles.toggleRow}>
          <button
            type="button"
            className={`${styles.toggleButton} ${styles.toggleActive}`}
          >
            Login
          </button>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => navigate('/register')}
          >
            Sign up
          </button>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.avatarColumn}>
            <div className={styles.avatarCircle}>
              <span className={styles.avatarEmoji}>🙂</span>
            </div>
            <p className={styles.brandText}>Hey Stranger!</p>
          </div>
          <div className={styles.formColumn}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in to continue your story.</p>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Email or Username
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <i className="fas fa-user" />
              </span>
              <input
                type="text"
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Enter email or username"
              />
            </div>
          </label>
          <label className={styles.label}>
            Password
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <i className="fas fa-lock" />
              </span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Enter password"
              />
            </div>
          </label>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <p className={styles.switchText}>
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
