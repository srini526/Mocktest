import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allExams } from '../data/exams.js';
import {
  getAdminAttempts,
  getAdminQuestionReports,
  getAdminUsers,
  getCurrentUser,
  logout,
  overrideAttemptScore,
  updateStudentExamAccess,
  updateStudentStatus,
} from '../lib/api.js';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [students, setStudents] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [reports, setReports] = useState([]);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [accessDrafts, setAccessDrafts] = useState({});
  const [scoreDrafts, setScoreDrafts] = useState({});
  const [reasonDrafts, setReasonDrafts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const loadAdminData = useCallback(async () => {
    const [studentData, attemptData, reportData] = await Promise.all([
      getAdminUsers(),
      getAdminAttempts(),
      getAdminQuestionReports(),
    ]);
    setStudents(studentData);
    setAttempts(attemptData);
    setReports(reportData);
    setStatusDrafts(Object.fromEntries(studentData.map((student) => [student.id, student.status])));
    setAccessDrafts(Object.fromEntries(studentData.map((student) => [student.id, student.examAccess])));
    setScoreDrafts((current) => Object.fromEntries(attemptData.map((attempt) => [
      attempt.attemptId,
      current[attempt.attemptId] ?? attempt.finalScore,
    ])));
  }, []);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    getCurrentUser()
      .then(async ({ user }) => {
        if (!isCurrent) return;
        if (!user) {
          navigate('/admin-login', { replace: true });
          return;
        }
        if (user.role !== 'admin') {
          navigate('/admin-login', { replace: true });
          return;
        }
        setAdmin(user);
        await loadAdminData();
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Could not load admin data.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [loadAdminData, navigate]);

  const runAdminAction = async (key, action, successMessage) => {
    setBusyKey(key);
    setError('');
    setNotice('');
    try {
      await action();
      await loadAdminData();
      setNotice(successMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The change could not be saved.');
    } finally {
      setBusyKey('');
    }
  };

  const handleStudentSave = (student) => runAdminAction(
    student.id,
    async () => {
      await updateStudentStatus(student.id, statusDrafts[student.id]);
      await updateStudentExamAccess(student.id, accessDrafts[student.id] || []);
    },
    `Saved account and test access for ${student.displayName}.`,
  );

  const handleScoreSave = (attempt) => runAdminAction(
    attempt.attemptId,
    () => overrideAttemptScore(
      attempt.attemptId,
      Number(scoreDrafts[attempt.attemptId]),
      reasonDrafts[attempt.attemptId] || '',
    ),
    'Score override recorded in the audit history.',
  );

  const handleLogout = async () => {
    setError('');
    try {
      await logout();
      navigate('/account', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not sign out.');
    }
  };

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">Loading admin dashboard…</main>;
  }

  if (!admin) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
        <p className="text-slate-600">{error || 'Opening sign in…'}</p>
        <Link to="/admin-login" className="mt-4 font-semibold text-indigo-700 hover:underline">Sign in as admin</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Full access control</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Admin dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Signed in as {admin.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-semibold text-indigo-700 hover:underline">Home</Link>
            <button type="button" onClick={handleLogout} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Sign out</button>
          </div>
        </header>

        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Student accounts and test access</h2>
              <p className="mt-1 text-sm text-slate-600">Approve accounts, suspend access, and select exactly which tests each student can take.</p>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-800">{students.filter((student) => student.status === 'pending').length} awaiting approval</span>
          </div>
          {students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No student accounts have registered yet.</div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <article key={student.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{student.displayName}</h3>
                      <p className="text-sm text-slate-600">{student.email}</p>
                      <p className="mt-1 text-xs text-slate-500">Registered {student.createdAt}</p>
                    </div>
                    <label className="text-sm font-semibold text-slate-700">
                      Account status
                      <select
                        value={statusDrafts[student.id] || student.status}
                        onChange={(event) => setStatusDrafts((current) => ({ ...current, [student.id]: event.target.value }))}
                        className="ml-3 rounded-lg border border-slate-300 bg-white px-3 py-2"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Approved / active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </label>
                  </div>
                  <fieldset className="mt-5">
                    <legend className="text-sm font-bold text-slate-800">Allowed tests</legend>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {allExams.map((exam) => {
                        const selected = (accessDrafts[student.id] || []).includes(exam.id);
                        return (
                          <label key={exam.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${selected ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => setAccessDrafts((current) => {
                                const currentAccess = current[student.id] || [];
                                return {
                                  ...current,
                                  [student.id]: event.target.checked
                                    ? [...currentAccess, exam.id]
                                    : currentAccess.filter((id) => id !== exam.id),
                                };
                              })}
                              className="mt-0.5 accent-indigo-600"
                            />
                            <span className="font-medium text-slate-800">{exam.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                  <button type="button" onClick={() => handleStudentSave(student)} disabled={busyKey === student.id} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
                    {busyKey === student.id ? 'Saving…' : 'Save approval and test access'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Student scores and attempts</h2>
            <p className="mt-1 text-sm text-slate-600">Original automatic scores are retained. Each adjustment requires a reason and is added to an audit history.</p>
          </div>
          {attempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No completed test attempts yet.</div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <article key={attempt.attemptId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{attempt.studentName}</h3>
                      <p className="text-sm text-slate-600">{attempt.studentEmail || 'Previous demo attempt'} · {attempt.examId.replaceAll('-', ' ')}</p>
                      <p className="mt-1 text-xs text-slate-500">{attempt.submittedAt} · {attempt.correctAnswers}/{attempt.totalQuestions} correct · {attempt.questionsAnswered} answered</p>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div><p className="text-xs text-slate-500">Automatic</p><p className="text-xl font-bold text-slate-800">{attempt.automaticScore}%</p></div>
                      <div><p className="text-xs text-slate-500">Current final</p><p className="text-xl font-extrabold text-indigo-700">{attempt.finalScore}%</p></div>
                    </div>
                  </div>

                  <form onSubmit={(event) => { event.preventDefault(); handleScoreSave(attempt); }} className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[150px_1fr_auto] sm:items-end">
                    <div>
                      <label htmlFor={`score-${attempt.attemptId}`} className="mb-1 block text-xs font-bold text-slate-600">Override final score (%)</label>
                      <input id={`score-${attempt.attemptId}`} type="number" min="0" max="100" step="0.01" required value={scoreDrafts[attempt.attemptId] ?? attempt.finalScore} onChange={(event) => setScoreDrafts((current) => ({ ...current, [attempt.attemptId]: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor={`reason-${attempt.attemptId}`} className="mb-1 block text-xs font-bold text-slate-600">Reason for change (required)</label>
                      <input id={`reason-${attempt.attemptId}`} minLength="10" maxLength="1000" required value={reasonDrafts[attempt.attemptId] || ''} onChange={(event) => setReasonDrafts((current) => ({ ...current, [attempt.attemptId]: event.target.value }))} placeholder="Explain why this score is being adjusted" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                    </div>
                    <button type="submit" disabled={busyKey === attempt.attemptId} className="rounded-lg bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-60">
                      {busyKey === attempt.attemptId ? 'Saving…' : 'Record override'}
                    </button>
                  </form>

                  {attempt.overrideHistory.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <h4 className="text-sm font-bold text-amber-900">Score adjustment audit history</h4>
                      <ul className="mt-2 space-y-2">
                        {attempt.overrideHistory.map((record, index) => (
                          <li key={`${record.createdAt}-${index}`} className="text-sm text-amber-900">
                            <strong>{record.score}%</strong> · {record.reason} <span className="text-xs text-amber-700">— {record.adminEmail}, {record.createdAt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-indigo-700 hover:text-indigo-900">Review submitted answers</summary>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {attempt.results.map((answer) => (
                        <div key={answer.questionId} className="rounded-lg border border-slate-200 p-3 text-sm">
                          <p className="font-bold text-slate-800">Question {answer.questionId} · {answer.score ? 'Correct' : 'Incorrect'}</p>
                          <p className="mt-1 text-slate-600">Student: {answer.userAnswer || 'Not answered'}</p>
                          {!answer.score && <p className="text-slate-600">Accepted: {answer.correctAnswer}</p>}
                        </div>
                      ))}
                    </div>
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Question reports</h2>
            <p className="mt-1 text-sm text-slate-600">Feedback submitted by students about individual questions.</p>
          </div>
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No question reports yet.</div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <strong className="text-slate-900">{report.examId} · Question {report.questionId}</strong>
                    <time className="text-slate-500">{report.submittedAt}</time>
                  </div>
                  <p className="mt-3 text-slate-700">{report.message}</p>
                  <p className="mt-2 text-xs text-slate-500">Student ID {report.userId}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;
