// src/Components/QuestionDisplay.jsx

import React, { useState } from 'react';

const AnswerInputSection = ({ question, onAnswerChange }) => {
  if (question.type === 'text') {
    return (
      <input
        id={`answer-${question.id}`}
        type="text"
        value={question.userAnswer || ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Type your answer here..."
        maxLength={1000}
        aria-label={`Answer for question ${question.id}`}
      />
    );
  }

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Choose an answer</legend>
      {question.options.map((option, index) => (
        <label
          key={option}
          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
            question.userAnswer === index
            ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
            : 'hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name={`option-${question.id}`}
            className="mr-4 accent-blue-600"
            checked={question.userAnswer === index}
            onChange={() => onAnswerChange(index)}
          />
          <span>{option}</span>
        </label>
      ))}
    </fieldset>
  );
};

// This is the main component. Note its props no longer include anything about accuracy.
const QuestionDisplay = ({ question, onAnswerChange, onNext, onClear, onBookmark, onReport, isLast }) => {
  const [isReporting, setIsReporting] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportStatus, setReportStatus] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);

  if (!question) {
    return <div>Loading...</div>;
  }

  const isBookmarked = question.status === 'review';

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    setIsSendingReport(true);
    setReportStatus('');
    try {
      const result = await onReport(reportMessage);
      setReportStatus(result.message);
      setReportMessage('');
      setIsReporting(false);
    } catch (error) {
      setReportStatus(error instanceof Error ? error.message : 'Your report could not be sent. Please try again.');
    } finally {
      setIsSendingReport(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Q: {question.id}</h2>
        <button
          type="button"
          onClick={() => {
            setIsReporting((open) => !open);
            setReportStatus('');
          }}
          className="text-sm text-red-600 hover:underline"
        >
          {isReporting ? 'Cancel report' : 'Report question'}
        </button>
      </div>

      <div className="text-gray-800 text-base mb-6 min-h-[120px] flex-grow">
        <p className="mb-2">{question.text || ''}</p>
        <p className="font-semibold mt-4">{question.prompt}</p>
      </div>

      <div className="mb-8">
        <AnswerInputSection 
          question={question} 
          onAnswerChange={onAnswerChange} 
        />
      </div>

      {isReporting && (
        <form onSubmit={handleReportSubmit} className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <label htmlFor={`report-${question.id}`} className="mb-2 block text-sm font-semibold text-gray-800">
            What needs attention in this question?
          </label>
          <textarea
            id={`report-${question.id}`}
            value={reportMessage}
            onChange={(event) => setReportMessage(event.target.value)}
            minLength={10}
            maxLength={1000}
            required
            rows={3}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-red-400"
            placeholder="Describe the issue (at least 10 characters)."
          />
          <button type="submit" disabled={isSendingReport || reportMessage.trim().length < 10} className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSendingReport ? 'Sending…' : 'Send report'}
          </button>
        </form>
      )}
      {reportStatus && <p role="status" className="mb-4 text-sm text-gray-700">{reportStatus}</p>}

      <div className="flex justify-between items-center mt-auto pt-4 border-t">
        <div>
          <button
            type="button"
            onClick={onBookmark}
            className={`py-2 px-4 mr-2 border rounded-lg transition-colors ${
              isBookmarked
              ? 'bg-purple-500 text-white border-purple-500'
              : 'text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button type="button" onClick={onClear} className="py-2 px-4 text-gray-700 border-gray-300 rounded-lg hover:bg-gray-100">
            Clear Response
          </button>
        </div>
        <button type="button" onClick={onNext} disabled={isLast} className="py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          {isLast ? 'Last question' : 'Save and Next →'}
        </button>
      </div>
    </div>
  );
};

export default QuestionDisplay;