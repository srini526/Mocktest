import React from 'react';
import { Link } from 'react-router-dom';

const SubscriptionSection = () => (
  <section id="support" className="bg-slate-50 px-6 py-16 sm:py-20">
    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-indigo-700 to-slate-900 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:p-12">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">Ready when you are</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Turn practice into progress.</h2>
        <p className="mt-3 leading-7 text-indigo-100">Pick a test and get started. Your score and answer review are ready as soon as you submit.</p>
      </div>
      <Link to="/exams" className="shrink-0 rounded-xl bg-cyan-300 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-200">
        Browse practice tests <span aria-hidden="true" className="ml-2">→</span>
      </Link>
    </div>
  </section>
);

export default SubscriptionSection;
