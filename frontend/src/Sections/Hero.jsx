import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => (
  <section id="home" className="relative isolate overflow-hidden bg-slate-950 px-6 pb-24 pt-36 text-white sm:pb-32 sm:pt-44">
    <div aria-hidden="true" className="absolute -right-24 -top-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-indigo-500/25 blur-3xl" />
    <div aria-hidden="true" className="absolute -bottom-60 -left-32 -z-10 h-[36rem] w-[36rem] rounded-full bg-cyan-400/15 blur-3xl" />
    <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
      <div className="max-w-3xl">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-300" />
          Practice with purpose
        </p>
        <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
          Make your next
          <span className="block bg-gradient-to-r from-cyan-200 to-indigo-300 bg-clip-text text-transparent">attempt count.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
          Build confidence with timed mock tests, clear feedback, and focused practice across general knowledge, verbal reasoning, and logic.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/exams" className="rounded-xl bg-cyan-300 px-6 py-3.5 font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-200">
            Explore practice tests
          </Link>
          <a href="#how-it-works" className="rounded-xl border border-white/15 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">
            See how it works
          </a>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
          <span><strong className="text-white">3</strong> practice series</span>
          <span><strong className="text-white">25</strong> questions per test</span>
          <span><strong className="text-white">60 min</strong> per attempt</span>
        </div>
      </div>

      <div aria-label="Practice test preview" className="relative mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/[.06] p-5 shadow-2xl shadow-indigo-950/40 backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Live practice</p>
            <p className="mt-1 font-bold text-white">Question 08 <span className="font-normal text-slate-400">of 25</span></p>
          </div>
          <span className="rounded-lg bg-indigo-300/10 px-3 py-2 font-mono text-sm font-bold text-indigo-100">42:18</span>
        </div>
        <p className="py-6 text-lg font-semibold leading-relaxed text-white">Which city is the capital of Australia?</p>
        <div className="space-y-2.5">
          {['Sydney', 'Canberra', 'Melbourne', 'Perth'].map((answer, index) => (
            <div key={answer} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${index === 1 ? 'border-cyan-200/60 bg-cyan-300/10 text-cyan-50' : 'border-white/10 bg-slate-900/40 text-slate-300'}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${index === 1 ? 'bg-cyan-300 text-slate-950' : 'bg-white/10 text-slate-300'}`}>{String.fromCharCode(65 + index)}</span>
              {answer}
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
          <span>Save and move at your pace</span>
          <span className="font-semibold text-cyan-200">08 / 25</span>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
