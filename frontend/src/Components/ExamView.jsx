import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import QuestionPalette from './QuestionPalette';
import QuestionDisplay from './QuestionDisplay';
import { allExams } from '../data/exams.js';
import { getCurrentUser, submitExam, submitQuestionReport } from '../lib/api.js';

const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
};

const ExamHeader = ({ onSubmit, onShowInstructions, onExit, timeLeft, title, isSubmitting }) => (
  <header className="sticky top-0 z-10 flex flex-col gap-3 bg-white px-4 py-3 shadow-md sm:flex-row sm:items-center sm:justify-between">
    <div className="flex-1 text-center sm:text-left">
      <h1 className="text-base font-semibold leading-tight text-gray-800 sm:text-lg">{title}</h1>
      <p className="mt-1 text-xs text-gray-500">Your answers stay available while you take the test.</p>
    </div>
    <div className="flex flex-col items-center justify-center" role="timer" aria-label={`Time remaining ${formatTime(timeLeft)}`}>
      <div className={`text-3xl font-extrabold leading-none tracking-wide ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
        {formatTime(timeLeft)}
      </div>
      <div className="mt-1 text-xs text-gray-500">Hours : Minutes : Seconds</div>
    </div>
    <div className="flex flex-1 flex-wrap items-center justify-center gap-2 sm:justify-end">
      <button type="button" onClick={onExit} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100">
        Exit
      </button>
      <button type="button" onClick={onShowInstructions} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100">
        Instructions
      </button>
      <button type="button" onClick={() => onSubmit(false)} disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
        {isSubmitting ? 'Submitting…' : 'Submit test'}
      </button>
    </div>
  </header>
);

const ExamView = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const currentExamData = allExams.find((exam) => exam.id === examId);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [accessState, setAccessState] = useState('checking');
  const submissionInProgress = useRef(false);
  const autoSubmitStarted = useRef(false);

  useEffect(() => {
    submissionInProgress.current = false;
    autoSubmitStarted.current = false;
    setSubmissionError('');
    setAccessState('checking');

    if (!currentExamData) {
      setQuestions([]);
      return;
    }

    setQuestions(currentExamData.questions.map((question, index) => ({
      ...question,
      userAnswer: question.type === 'text' ? '' : null,
      status: index === 0 ? 'not-answered' : 'not-visited',
    })));
    setCurrentIndex(0);
    setTimeLeft((currentExamData.durationMinutes || 60) * 60);
  }, [currentExamData, examId]);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(({ user }) => {
        if (!active) return;
        if (!user) {
          setAccessState('sign-in');
          return;
        }
        if (user.role !== 'student' || user.status !== 'active') {
          setAccessState('approval');
          return;
        }
        setAccessState(user.examAccess.includes(examId) ? 'allowed' : 'not-assigned');
      })
      .catch(() => {
        if (active) setAccessState('sign-in');
      });
    return () => {
      active = false;
    };
  }, [examId]);

  useEffect(() => {
    if (!questions.length || accessState !== 'allowed') {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          window.clearInterval(timerId);
          return 0;
        }
        return currentTime - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [accessState, examId, questions.length]);

  const handleSubmit = useCallback(async (automatic = false) => {
    if (submissionInProgress.current) {
      return;
    }

    const unansweredCount = questions.filter((question) => {
      if (question.type === 'mcq') {
        return question.userAnswer === null;
      }
      return !question.userAnswer.trim();
    }).length;

    if (!automatic) {
      const message = unansweredCount
        ? `You have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}. Submit this test anyway?`
        : 'Submit this test? You will not be able to change your answers afterward.';
      if (!window.confirm(message)) {
        return;
      }
    }

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setSubmissionError('');

    try {
      const result = await submitExam({
        examId,
        answers: questions.map((question) => ({
          id: question.id,
          answer: question.type === 'mcq'
            ? (question.userAnswer === null ? '' : question.options[question.userAnswer])
            : question.userAnswer,
        })),
      });

      navigate('/results', {
        replace: true,
        state: {
          ...result,
          examTitle: currentExamData.title,
        },
      });
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'The test could not be submitted. Please try again.');
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }, [currentExamData, examId, navigate, questions]);

  useEffect(() => {
    if (timeLeft === 0 && questions.length && !autoSubmitStarted.current) {
      autoSubmitStarted.current = true;
      handleSubmit(true);
    }
  }, [handleSubmit, questions.length, timeLeft]);

  const handleAnswerChange = (answerValue) => {
    setQuestions((currentQuestions) => currentQuestions.map((question, index) => {
      if (index !== currentIndex) {
        return question;
      }
      const isAnswered = question.type === 'mcq'
        ? answerValue !== null
        : Boolean(answerValue.trim());
      return {
        ...question,
        userAnswer: answerValue,
        status: isAnswered ? 'answered' : 'not-answered',
      };
    }));
  };

  const handleNextQuestion = () => {
    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
    setQuestions((currentQuestions) => currentQuestions.map((question, index) => (
      index === currentIndex + 1 && question.status === 'not-visited'
        ? { ...question, status: 'not-answered' }
        : question
    )));
  };

  const handleClearResponse = () => {
    setQuestions((currentQuestions) => currentQuestions.map((question, index) => {
      if (index !== currentIndex) {
        return question;
      }
      return {
        ...question,
        userAnswer: question.type === 'text' ? '' : null,
        status: 'not-answered',
      };
    }));
  };

  const handleBookmark = () => {
    setQuestions((currentQuestions) => currentQuestions.map((question, index) => {
      if (index !== currentIndex) {
        return question;
      }
      const isAnswered = question.type === 'mcq'
        ? question.userAnswer !== null
        : Boolean(question.userAnswer.trim());
      return {
        ...question,
        status: question.status === 'review' ? (isAnswered ? 'answered' : 'not-answered') : 'review',
      };
    }));
  };

  const handlePaletteClick = (questionIndex) => {
    setQuestions((currentQuestions) => currentQuestions.map((question, index) => (
      index === questionIndex && question.status === 'not-visited'
        ? { ...question, status: 'not-answered' }
        : question
    )));
    setCurrentIndex(questionIndex);
  };

  const handleReport = async (message) => {
    return submitQuestionReport({
      examId,
      questionId: questions[currentIndex].id,
      message,
    });
  };

  if (!currentExamData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 text-center">
        <h1 className="mb-4 text-3xl font-bold text-red-600">Exam not found</h1>
        <p className="mb-8 text-gray-700">The exam ID you requested does not exist.</p>
        <Link to="/exams" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">Back to exam selection</Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) {
    return <div className="p-8 text-center text-gray-600">Preparing your test…</div>;
  }

  if (accessState !== 'allowed') {
    const accessMessage = {
      checking: 'Checking your account and test access…',
      'sign-in': 'Sign in with your student account to take this test.',
      approval: 'Your account must be approved by an administrator before you can take tests.',
      'not-assigned': 'An administrator has not assigned this test to your account yet.',
    }[accessState];
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{accessState === 'checking' ? 'Checking access' : 'Test access required'}</h1>
        <p className="mt-3 max-w-lg text-slate-600">{accessMessage}</p>
        <div className="mt-6 flex gap-3">
          {accessState === 'sign-in' && <Link to={`/account?next=${encodeURIComponent(`/exam/${examId}`)}`} className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Sign in</Link>}
          <Link to="/exams" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100">Back to tests</Link>
        </div>
      </main>
    );
  }

  const answeredCount = questions.filter((question) => (
    question.type === 'mcq' ? question.userAnswer !== null : Boolean(question.userAnswer.trim())
  )).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <ExamHeader
        onSubmit={handleSubmit}
        onShowInstructions={() => setShowInstructions(true)}
        onExit={() => {
          if (window.confirm('Exit this test? Your current answers will be lost.')) {
            navigate('/exams');
          }
        }}
        timeLeft={timeLeft}
        title={currentExamData.title}
        isSubmitting={isSubmitting}
      />
      <main className="mx-auto max-w-7xl p-4">
        <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
        {submissionError && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <span>{submissionError}</span>
            <button type="button" onClick={() => handleSubmit(true)} disabled={isSubmitting} className="rounded-md bg-red-700 px-3 py-2 font-semibold text-white hover:bg-red-800 disabled:opacity-60">
              Retry submission
            </button>
          </div>
        )}
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="min-w-0 flex-1">
            <QuestionDisplay
              key={currentQuestion.id}
              question={currentQuestion}
              onAnswerChange={handleAnswerChange}
              onNext={handleNextQuestion}
              onClear={handleClearResponse}
              onBookmark={handleBookmark}
              onReport={handleReport}
              isLast={currentIndex === questions.length - 1}
            />
          </div>
          <div className="w-full flex-shrink-0 lg:w-[340px]">
            <QuestionPalette questions={questions} currentIndex={currentIndex} onQuestionSelect={handlePaletteClick} />
          </div>
        </div>
      </main>
      {showInstructions && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setShowInstructions(false);
          }
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="instructions-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="instructions-title" className="mb-3 text-xl font-bold text-gray-900">Test instructions</h2>
            <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-gray-700">
              <li>Choose one answer for each multiple-choice question or type a short response.</li>
              <li>Use the question palette to move between questions. Purple marks a question for review.</li>
              <li>The test submits automatically when the timer reaches zero.</li>
              <li>Each question is worth one point; unanswered questions receive no credit.</li>
            </ul>
            <button type="button" autoFocus onClick={() => setShowInstructions(false)} className="mt-6 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700">Got it</button>
          </section>
        </div>
      )}
    </div>
  );
};

export default ExamView;
