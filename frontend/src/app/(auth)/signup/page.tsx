'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Eye, EyeOff, Mail, Lock, User, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const passwordStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength] || '';
  const strengthColor = ['', '#f04438', '#f79009', '#2e90fa', '#10b981', '#059669'][strength] || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/auth/signup`, {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setSuccess(true);
      setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Zap size={20} color="#fff" />
          </div>
          <span className="auth-logo-text">GradeAI</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join GradeAI as a teacher</p>

        {success ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12, padding: '32px 0', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--accent-dim)', border: '1px solid var(--accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={26} color="var(--accent)" />
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Account created!</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Redirecting to dashboard…</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="error-banner" style={{ marginBottom: 20 }}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Full name */}
              <div className="auth-field">
                <label className="field-label" htmlFor="name">Full name</label>
                <div className="auth-input-wrap">
                  <User size={15} className="auth-input-icon" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="field-input auth-input"
                    placeholder="Ms. Jane Smith"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email */}
              <div className="auth-field">
                <label className="field-label" htmlFor="email">Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={15} className="auth-input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="field-input auth-input"
                    placeholder="you@school.edu"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <label className="field-label" htmlFor="password">Password</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="field-input auth-input auth-input-pr"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Strength meter */}
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 99,
                          background: i <= strength ? strengthColor : 'var(--border)',
                          transition: 'background .2s',
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 11.5, color: strengthColor, fontWeight: 500 }}>{strengthLabel}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="auth-field">
                <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    className="field-input auth-input auth-input-pr"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirm(v => !v)}
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 5 }}>Passwords don&apos;t match</p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner" />
                    Creating account…
                  </>
                ) : 'Create account'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{' '}
              <Link href="/login" className="auth-link">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
