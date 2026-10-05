import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer id="contact" className="bg-slate-950 px-4 py-10 text-slate-400 sm:px-6">
    <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 border-b border-white/10 pb-8 sm:flex-row">
      <div className="max-w-md">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-white">Mathogic</Link>
        <p className="mt-3 text-sm leading-6">Focused practice tests for general knowledge, verbal reasoning, and logical thinking.</p>
      </div>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium">
        <Link to="/exams" className="transition hover:text-white">Practice tests</Link>
        <Link to="/#why-choose" className="transition hover:text-white">About</Link>
        <Link to="/admin-login" className="transition hover:text-white">Admin login</Link>
      </nav>
    </div>
    <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 pt-5 text-xs text-slate-500">
      <span>© {new Date().getFullYear()} Mathogic. Practice with purpose.</span>
      <span>Mock test practice and answer review.</span>
    </div>
  </footer>
);

export default Footer;
