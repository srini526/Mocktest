import React, { useState, useEffect } from 'react';
import QuestionPalette from './QuestionPalette';
import QuestionDisplay from './QuestionDisplay';
import { examQuestions } from '../data/questions';

const InfoIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0-0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
};


const ExamHeader = ({ onSubmit, timeLeft }) => (
    <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-700">AFCAT Test Series 2023 I &gt; Reasoning</h1>
        </div>

        <div className="text-center">
            <div className="text-2xl font-bold tracking-wider text-gray-800">{formatTime(timeLeft)}</div>
            <div className="text-xs text-gray-500">Hrs : Min : Sec</div>
        </div>

        <div className="flex-1 flex justify-end items-center space-x-3">
            <button className="py-2 px-4 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Exit</button>
            <button
              className="p-2 text-gray-600 border border-gray-300 rounded-full hover:bg-gray-100"
              title="Instructions"
            >
              <InfoIcon />
            </button>
            <button onClick={onSubmit} className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Review and Submit</button>
        </div>
    </header>
);

const ExamView = () => {
  const [questions, setQuestions] = useState(examQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800);

  useEffect(() => {
    if (timeLeft <= 0) return; 

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

  return () => clearInterval(timerId);
  }, [timeLeft]);


  useEffect(() => {
    setQuestions(prev => prev.map((q, index) => index === 0 ? {...q, status: 'not-answered'} : q))
  }, [])

  const handleAnswerChange = (answerValue) => {
    const newQuestions = questions.map((q, index) => {
      if (index === currentIndex) {
        let newStatus = 'not-answered';
        if (q.type === 'text' && answerValue.trim() !== '') {
          newStatus = 'answered';
        } else if (q.type === 'mcq' && answerValue !== null) {
          newStatus = 'answered';
        }
        return { ...q, userAnswer: answerValue, status: newStatus };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
       const newQuestions = questions.map((q, index) => {
        if (index === currentIndex + 1 && q.status === 'not-visited') {
          return { ...q, status: 'not-answered' };
        }
        return q;
      });
      setQuestions(newQuestions);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleClearResponse = () => {
    const newQuestions = questions.map((q, index) => {
      if (index === currentIndex) {
        const clearedAnswer = questions[currentIndex].type === 'text' ? '' : null;
        return { ...q, userAnswer: clearedAnswer, status: 'not-answered' };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const handleBookmark = () => {
     const newQuestions = questions.map((q, index) => {
      if (index === currentIndex) {
        const currentAnswer = q.userAnswer;
        const isAnswered = q.type === 'mcq' ? currentAnswer !== null : currentAnswer.trim() !== '';
        const newStatus = q.status === 'review' ? (isAnswered ? 'answered' : 'not-answered') : 'review';
        return { ...q, status: newStatus };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const handlePaletteClick = (questionIndex) => {
    const newQuestions = questions.map((q, index) => {
      if (index === questionIndex && q.status === 'not-visited') {
        return { ...q, status: 'not-answered' };
      }
      return q;
    });
    setQuestions(newQuestions);
    setCurrentIndex(questionIndex);
  };

  const handleSubmit = () => {
    alert("Test Submitted! Check the console for your answers.");
    console.log(questions.map(q => ({id: q.id, answer: q.userAnswer})));
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-100">
        <ExamHeader onSubmit={handleSubmit} timeLeft={timeLeft} />
        <main className="p-4 flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
                <QuestionDisplay
                  question={currentQuestion}
                  onAnswerChange={handleAnswerChange}
                  onNext={handleNextQuestion}
                  onClear={handleClearResponse}
                  onBookmark={handleBookmark}
                />
            </div>
            <div className="w-full lg:w-[340px] flex-shrink-0">
                <QuestionPalette
                  questions={questions}
                  currentIndex={currentIndex}
                  onQuestionSelect={handlePaletteClick}
                />
            </div>
        </main>
    </div>
  );
};

export default ExamView;