import React from 'react';

const AnswerInputSection = ({ question, onAnswerChange }) => {
 if (question.type === 'text') {
    return (
      <div>
        <input
          type="text"
          value={question.userAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Type your answer here..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {question.options.map((option, index) => (
        <label
          key={index}
          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
            question.userAnswer === index
            ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
            : 'hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name={`option-${question.id}`}
            className="mr-4"
            checked={question.userAnswer === index}
            onChange={() => onAnswerChange(index)}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
};


const QuestionDisplay = ({ question, onAnswerChange, onNext, onClear, onBookmark }) => {
  if (!question) return <div>Loading...</div>;

  const isBookmarked = question.status === 'review';

  return (
    <div className="p-6 bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Q: {question.id}</h2>
        <button className="text-sm text-red-500 hover:underline">Report</button>
      </div>

      <div className="text-gray-800 text-base mb-6 min-h-[120px] flex-grow">
        <p className="mb-2">{question.text}</p>
        <p className="font-semibold mt-4">{question.prompt}</p>
      </div>

      <div className="mb-8">
        <AnswerInputSection 
          question={question} 
          onAnswerChange={onAnswerChange} 
        />
      </div>

      <div className="flex justify-between items-center mt-auto pt-4 border-t">
        <div>
          <button
            onClick={onBookmark}
            className={`py-2 px-4 mr-2 border rounded-lg transition-colors ${
              isBookmarked
              ? 'bg-purple-500 text-white border-purple-500'
              : 'text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button onClick={onClear} className="py-2 px-4 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">
            Clear Response
          </button>
        </div>
        <button onClick={onNext} className="py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
          Save and Next &rarr;
        </button>
      </div>
    </div>
  );
};

export default QuestionDisplay;