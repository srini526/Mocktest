import React from 'react';

const steps = [
  ['Choose a practice series', 'Pick general knowledge, verbal reasoning, or logic based on what you want to sharpen.'],
  ['Take a timed attempt', 'Move between questions, clear responses, and mark items to revisit before submitting.'],
  ['Review and improve', 'See your score and compare each response with its accepted answer.'],
];

const InterviewPrep = () => (
  <section id="how-it-works" className="bg-slate-950 px-6 py-20 text-white sm:py-24">
    <div className="mx-auto max-w-7xl">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">A simple routine</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Practice. Review. Repeat.</h2>
        <p className="mt-4 leading-7 text-slate-300">Make every attempt useful with a clear start, focused test session, and actionable review.</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map(([title, description], index) => (
          <article key={title} className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
            <span className="text-sm font-extrabold text-cyan-200">STEP 0{index + 1}</span>
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default InterviewPrep;
