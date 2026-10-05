// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import LandingPage from './Pages/LandingPage';
import ExamSelectionPage from './Pages/ExamSelectionPage';
import ResultsPage from './Pages/ResultsPage';
import AdminDashboard from './Pages/AdminDashboard';
import ExamView from './Components/ExamView';
import AccountPage from './Pages/AccountPage';
import AdminLoginPage from './Pages/AdminLoginPage';

const NotFoundPage = () => (
  <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">404</p>
    <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Page not found</h1>
    <p className="mt-2 text-slate-600">The page you’re looking for isn’t available.</p>
    <Link to="/" className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">Return home</Link>
  </main>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/exams" element={<ExamSelectionPage />} />
        <Route path="/exam/:examId" element={<ExamView />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;