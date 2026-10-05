import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const navigation = [
  { label: 'Home', to: '/#home' },
  { label: 'Practice tests', to: '/exams' },
  { label: 'Why Mathogic', to: '/#why-choose' },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/85 text-white shadow-lg shadow-slate-950/10 backdrop-blur-xl">
      <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-indigo-500 text-lg font-black text-slate-950">M</span>
          <span className="text-xl font-extrabold tracking-tight">Mathogic</span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link key={item.label} to={item.to} className="text-sm font-medium text-slate-300 transition hover:text-white">
              {item.label}
            </Link>
          ))}
          <Link to="/exams" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
            Start practicing
          </Link>
          <Link to="/account" className="text-sm font-medium text-slate-300 transition hover:text-white">
            Student login
          </Link>
          <Link to="/admin-login" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10">
            Admin login
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white hover:bg-white/10 lg:hidden"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
        >
          <span aria-hidden="true" className="text-xl">{isOpen ? '×' : '☰'}</span>
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigation.map((item) => (
              <Link key={item.label} to={item.to} onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/10">
                {item.label}
              </Link>
            ))}
            <Link to="/exams" onClick={() => setIsOpen(false)} className="mt-2 rounded-lg bg-cyan-300 px-3 py-3 text-center text-sm font-bold text-slate-950">
              Start practicing
            </Link>
            <Link to="/account" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-3 text-center text-sm font-medium text-slate-200 hover:bg-white/10">
              Student login
            </Link>
            <Link to="/admin-login" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-3 text-center text-sm font-semibold text-white hover:bg-white/10">
              Admin login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
