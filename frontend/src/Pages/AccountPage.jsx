import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allExams } from '../data/exams.js';
import { getCurrentUser, getMyAttempts, loginStudent, logout, registerStudent } from '../lib/api.js';

const AccountPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        if (currentUser?.role === 'student' && currentUser.status === 'active') {
          return getMyAttempts().then((data) => {
            if (active) setAttempts(data);
          });
        }
        return undefined;
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load your account.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      if (mode === 'register') {
        const result = await registerStudent(form);
        setNotice(result.message);
        setMode('login');
        setForm((current) => ({ ...current, password: '' }));
        return;
      }
      const result = await loginStudent({ email: form.email, password: form.password });
      setUser(result.user);
      navigate('/exams', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not complete your request.');
    }
  };

  const handleLogout = async () => {
    setError('');
    try {
      await logout();
      setUser(null);
      setAttempts([]);
      setNotice('You have signed out.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not sign out.');
    }
  };

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">Loading account…</main>;
  }

  if (user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Your account</p>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{user.displayName}</h1>
              <p className="mt-1 text-slate-600">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <Link to="/" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-100">
                Home
              </Link>
              <Link to={user.role === 'admin' ? '/admin' : '/exams'} className="rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700">
                {user.role === 'admin' ? 'Admin dashboard' : 'Practice tests'}
              </Link>
              <button type="button" onClick={handleLogout} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-100">Sign out</button>
            </div>
          </div>

          {user.role === 'student' && user.status !== 'active' && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="font-bold text-amber-900">Account approval pending</h2>
              <p className="mt-2 text-sm leading-6 text-amber-800">An administrator must approve your account and assign one or more tests before you can start practicing.</p>
            </section>
          )}

          {user.role === 'student' && user.status === 'active' && (
            <>
              <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-bold text-slate-900">Tests available to you</h2>
                {user.examAccess.length ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {user.examAccess.map((examId) => <Link key={examId} to={`/exam/${examId}`} className="rounded-xl bg-indigo-50 px-4 py-3 font-semibold text-indigo-800 hover:bg-indigo-100">{examId.replaceAll('-', ' ')}</Link>)}
                  </div>
                ) : <p className="mt-2 text-sm text-slate-600">No tests have been assigned yet. Ask an administrator to grant test access.</p>}
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Your results and test history</h2>
                {attempts.length ? (
                  <div className="mt-4 space-y-3">
                    {attempts.map((attempt) => (
                      <article key={attempt.attemptId} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{attempt.examId.replaceAll('-', ' ')}</h3>
                          <p className="mt-1 text-xs text-slate-500">{attempt.submittedAt} · {attempt.correctAnswers}/{attempt.totalQuestions} correct</p>
                          {attempt.isOverridden && <p className="mt-1 text-xs font-semibold text-indigo-700">Score adjusted by admin</p>}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-extrabold text-indigo-700">{attempt.finalScore}%</p>
                            {attempt.isOverridden && <p className="text-xs text-slate-500">Original: {attempt.automaticScore}%</p>}
                          </div>
                          <Link
                            to="/results"
                            state={{
                              ...attempt,
                              examTitle: allExams.find((exam) => exam.id === attempt.examId)?.title || 'Practice test',
                              totalScore: attempt.results.reduce((total, result) => total + result.score, 0),
                            }}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                          >
                            View results
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <p className="mt-2 text-sm text-slate-600">Your completed tests will appear here.</p>}
              </section>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 shadow-2xl sm:p-9">
        <Link to="/" className="text-sm font-semibold text-indigo-700 hover:underline">&larr; Mathogic home</Link>
        <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Student access</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{mode === 'register' ? 'Create your student account' : 'Student sign in'}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {mode === 'register'
            ? 'Create an account. An administrator will approve your access to tests.'
            : 'Sign in to see your assigned practice tests and saved scores.'}
        </p>

        {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="displayName" className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</label>
              <input id="displayName" name="displayName" autoComplete="name" minLength={2} maxLength={100} required value={form.displayName} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" maxLength={254} required value={form.email} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <input id="password" name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 12 : undefined} required value={form.password} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            {mode === 'register' && <p className="mt-1 text-xs text-slate-500">Use at least 12 characters.</p>}
          </div>
          <button type="submit" className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700">
            {mode === 'register' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); setNotice(''); }} className="mt-5 w-full text-center text-sm font-semibold text-indigo-700 hover:underline">
          {mode === 'register' ? 'Already have an account? Sign in' : 'New here? Create a student account'}
        </button>
        <p className="mt-5 text-center text-sm text-slate-600">
          Administrator? <Link to="/admin-login" className="font-semibold text-indigo-700 hover:underline">Go to admin sign in</Link>
        </p>
      </section>
    </main>
  );
};

export default AccountPage;
