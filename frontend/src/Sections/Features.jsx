import React from 'react';
import { Link } from 'react-router-dom';
import { allExams } from '../data/exams.js';

const icons = ['◎', 'Aa', '∑'];

const Features = () => (
  <section id="tests" className="bg-slate-50 px-6 py-20 sm:py-24">
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Choose your focus</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Practice tests for your next step</h2>
        </div>
        <Link to="/exams" className="font-semibold text-indigo-700 hover:text-indigo-900">View all tests <span aria-hidden="true">→</span></Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {allExams.map((exam, index) => (
          <article key={exam.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-lg font-extrabold text-indigo-700">{icons[index]}</span>
            <h3 className="mt-5 text-xl font-bold text-slate-900">{exam.title}</h3>
            <p className="mt-2 flex-1 leading-relaxed text-slate-600">{exam.description}</p>
            <div className="mt-5 flex items-center gap-3 text-xs font-semibold text-slate-500">
              <span>{exam.questions.length} questions</span><span aria-hidden="true">·</span><span>{exam.durationMinutes} minutes</span>
            </div>
            <Link to={`/exam/${exam.id}`} className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition group-hover:bg-indigo-700">
              Start this test <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
