import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface Props {
  onSwitchToLogin: () => void;
}

export default function Register({ onSwitchToLogin }: Props) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{
              background: 'linear-gradient(135deg,#005A2F 0%,#003D20 100%)',
            }}
          >
            <span className="text-white font-bold text-lg font-display">NW</span>
          </div>
          <h1 className="text-2xl font-bold text-ink font-display">
            Create account
          </h1>
          <p className="text-muted text-sm mt-1">Join NairaWave today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                First name
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white
                           text-ink focus:outline-none focus:ring-2
                           focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Last name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white
                           text-ink focus:outline-none focus:ring-2
                           focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white
                         text-ink focus:outline-none focus:ring-2
                         focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Phone number
            </label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => update('phoneNumber', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white
                         text-ink focus:outline-none focus:ring-2
                         focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="08012345678"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white
                         text-ink focus:outline-none focus:ring-2
                         focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Min. 8 characters"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Confirm password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white
                         text-ink focus:outline-none focus:ring-2
                         focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl
                       hover:bg-primary-700 active:scale-[0.98] transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}