import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth';
import { useToast } from '../components/ToastContext.jsx';
import styles from './Auth.module.css';

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  });
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
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        showToast('Passwords do not match.', 'error');
        setLoading(false);
        return;
      }

      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        password: form.password,
      };

      const res = await register(payload);
      localStorage.setItem('token', res.data.token);
      showToast('Account created. Welcome!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      showToast(err.response?.data?.message || 'Registration failed.', 'error');
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
            className={styles.toggleButton}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${styles.toggleActive}`}
          >
            Sign up
          </button>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.avatarColumn}>
            <div className={styles.avatarCircle}>
              <span className={styles.avatarEmoji}>🧑🏻</span>
            </div>
            <p className={styles.brandText}>Join Hey Stranger!</p>
          </div>
          <div className={styles.formColumn}>
            <h1 className={styles.title}>Create your account</h1>
            <p className={styles.subtitle}>Fill in your details to get started.</p>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.label}>
                Full Name
                <div className={styles.inputGroup}>
                  <span className={styles.inputIcon}>
                    <i className="fas fa-user" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className={styles.input}
                    placeholder="Enter your full name"
                  />
                </div>
              </label>
              <label className={styles.label}>
                Username
                <div className={styles.inputGroup}>
                  <span className={styles.inputIcon}>
                    <i className="fas fa-at" />
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className={styles.input}
                    placeholder="Choose a username"
                  />
                </div>
              </label>
              <label className={styles.label}>
                Email
                <div className={styles.inputGroup}>
                  <span className={styles.inputIcon}>
                    <i className="fas fa-envelope" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className={styles.input}
                    placeholder="Enter your email"
                  />
                </div>
              </label>
              <label className={styles.label}>
                Phone Number
                <div className={styles.inputGroup}>
                  <span className={styles.inputIcon}>
                    <i className="fas fa-phone" />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter phone number"
                  />
                </div>
              </label>
              <label className={styles.label}>
                Gender
                <div className={styles.inputGroup}>
                  <span className={styles.inputIcon}>
                    <i className="fas fa-venus-mars" />
                  </span>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className={styles.input}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </label>
              <label className={styles.label}>
                Date of Birth
                <div className={styles.inputGroup}>
                  <span className={styles.inputIcon}>
                    <i className="fas fa-calendar" />
                  </span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className={styles.input}
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
                    placeholder="Create a password"
                  />
                </div>
              </label>
              <label className={styles.label}>
                Confirm Password
                <div className={styles.inputGroup}>
                  <span className={styles.inputIcon}>
                    <i className="fas fa-lock" />
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className={styles.input}
                    placeholder="Re-enter password"
                  />
                </div>
              </label>
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>
            <p className={styles.switchText}>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
