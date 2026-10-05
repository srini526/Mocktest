import React from 'react';

const benefits = [
  ['A realistic rhythm', 'Practice with a timer, question palette, and one-question-at-a-time flow.'],
  ['Know where you stand', 'See points, answered questions, and corrections as soon as you submit.'],
  ['Learn by reviewing', 'Revisit accepted answers and report questions that need attention.'],
];

const WhyChoose = () => (
  <section id="why-choose" className="bg-white px-6 py-20 sm:py-24">
    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Built for better practice</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">More than picking an answer.</h2>
        <p className="mt-5 max-w-xl leading-7 text-slate-600">A useful mock test should help you understand your progress, not just tell you when time is up. Practice, review, and focus on what to improve next.</p>
      </div>
      <div className="space-y-4">
        {benefits.map(([title, description], index) => (
          <article key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-extrabold text-indigo-700">0{index + 1}</span>
            <div>
              <h3 className="font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChoose;
