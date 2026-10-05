import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, loginAdmin } from '../lib/api.js';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(({ user }) => {
        if (!active || !user) return;
        navigate(user.role === 'admin' ? '/admin' : '/account', { replace: true });
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not check your session.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginAdmin(form);
      navigate('/admin', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">Checking admin session…</main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 shadow-2xl sm:p-9">
        <Link to="/" className="text-sm font-semibold text-indigo-700 hover:underline">&larr; Mathogic home</Link>
        <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Administrator access</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Sign in with the administrator email and password configured for this application.</p>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold text-slate-700">Admin email</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              maxLength={254}
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in as admin'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Student? <Link to="/account" className="font-semibold text-indigo-700 hover:underline">Go to student sign in</Link>
        </p>
      </section>
    </main>
  );
};

export default AdminLoginPage;
