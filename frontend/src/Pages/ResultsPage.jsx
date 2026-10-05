import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ResultsPage = () => {
  const { state } = useLocation();

  if (!state || !Number.isFinite(state.finalScore)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">No attempt found</p>
          <h1 className="mb-3 text-3xl font-bold text-slate-900">Your results will appear here</h1>
          <p className="mb-7 text-slate-600">Complete a practice test first, then return to review your score.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/" className="inline-flex rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
              Home
            </Link>
            <Link to="/account" className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700">
              Student dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const score = Math.max(0, Math.min(100, state.finalScore));
  const resultRows = Array.isArray(state.results) ? state.results : [];
  const scoreLabel = score >= 80 ? 'Excellent work' : score >= 50 ? 'Good progress' : 'Keep practicing';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Test complete</p>
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{scoreLabel}</h1>
            <p className="mt-2 text-slate-600">{state.examTitle || 'Practice test'}</p>
          </div>
          <nav aria-label="Results navigation" className="flex flex-wrap gap-3">
            <Link to="/" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700">
              Home
            </Link>
            <Link to="/account" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700">
              Student dashboard
            </Link>
            <Link to="/exams" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700">
              Take another test
            </Link>
          </nav>
        </div>

        <section aria-label="Score summary" className="grid gap-5 sm:grid-cols-[1fr_2fr]">
          <div className="flex flex-col items-center justify-center rounded-3xl bg-indigo-700 p-7 text-center text-white shadow-lg">
            <div className="relative mb-4 flex h-40 w-40 items-center justify-center rounded-full" style={{ background: `conic-gradient(#a5f3fc ${score}%, rgba(255,255,255,.18) ${score}% 100%)` }}>
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-indigo-700">
                <span className="text-4xl font-extrabold">{score}%</span>
              </div>
            </div>
            <p className="text-sm text-indigo-100">Final score</p>
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Correct</p>
              <p className="mt-1 text-3xl font-bold text-emerald-700">{state.correctAnswers ?? 0}<span className="text-lg font-medium text-slate-400"> / {state.totalQuestions ?? resultRows.length}</span></p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Answered</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{state.questionsAnswered ?? 0}<span className="text-lg font-medium text-slate-400"> / {state.totalQuestions ?? resultRows.length}</span></p>
            </div>
            <div className="col-span-2 rounded-2xl bg-indigo-50 p-4">
              <p className="text-sm text-indigo-700">Points earned</p>
              <p className="mt-1 text-2xl font-bold text-indigo-900">{state.totalScore ?? 0} <span className="text-base font-medium text-indigo-500">out of {state.totalQuestions ?? resultRows.length}</span></p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">Review your answers</h2>
            <p className="mt-1 text-sm text-slate-600">Each question is worth one point. Free-response answers are checked against accepted answers.</p>
          </div>
          <div className="space-y-3">
            {resultRows.map((result) => {
              const isCorrect = result.score === 1;
              return (
                <article key={result.questionId} className={`rounded-2xl border p-4 ${isCorrect ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">Question {result.questionId}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isCorrect ? 'Correct · 1 point' : 'Review · 0 points'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Your answer: <span className="font-medium text-slate-900">{result.userAnswer || 'Not answered'}</span>
                  </p>
                  {!isCorrect && (
                    <p className="mt-1 text-sm text-slate-600">
                      Accepted answer: <span className="font-medium text-slate-900">{result.correctAnswer}</span>
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ResultsPage;
