import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { allExams } from '../data/exams.js';
import { getCurrentUser } from '../lib/api.js';

const ExamSelectionPage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 sm:px-6">
    <div className="mx-auto max-w-7xl">
      <Link to="/" className="text-sm font-semibold text-indigo-700 hover:underline">&larr; Home</Link>
      <div className="mb-10 mt-6 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Choose a test</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Your next practice starts here.</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">Choose a subject, take the timed test, and review every answer when you finish.</p>
      </div>

      {!isLoading && !user && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm text-indigo-900">Sign in to see tests assigned to your student account.</p>
          <Link to="/account" className="rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white hover:bg-indigo-800">Sign in or register</Link>
        </div>
      )}
      {user?.role === 'student' && user.status === 'pending' && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Your account is waiting for admin approval before you can start a test.</p>
      )}
      {user?.role === 'student' && user.status === 'active' && user.examAccess.length === 0 && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">No tests have been assigned to your account yet.</p>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {allExams.map((exam, index) => (
          (() => {
            const canStart = user?.role === 'admin'
              || (user?.role === 'student' && user.status === 'active' && user.examAccess.includes(exam.id));
            const label = isLoading
              ? 'Checking access…'
              : canStart
                ? 'Start practice test'
                : !user
                  ? 'Sign in to start'
                  : user.status !== 'active'
                    ? 'Approval required'
                    : 'Access not assigned';
            return (
          <article key={exam.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-lg font-extrabold text-indigo-700">{['◎', 'Aa', '∑'][index]}</span>
            <h2 className="mt-5 text-xl font-bold text-slate-900">{exam.title}</h2>
            <p className="mt-2 flex-1 leading-relaxed text-slate-600">{exam.description}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1.5">{exam.questions.length} questions</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">{exam.durationMinutes} minutes</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">Timed</span>
            </div>
            {canStart ? (
              <Link to={`/exam/${exam.id}`} className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700">
                {label} <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <Link to="/account" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-300">
                {label}
              </Link>
            )}
          </article>
            );
          })()
        ))}
      </div>
    </div>
  </main>
  );
};

export default ExamSelectionPage;
