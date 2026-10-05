import React, { useMemo } from 'react';

const QuestionButton = ({ number, status, isCurrent, onClick }) => {
  const baseClasses = 'w-10 h-10 flex items-center justify-center rounded-md font-semibold text-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-600';

  const statusClasses = {
    'not-visited': 'bg-gray-200 text-gray-800',
    'answered': 'bg-green-500 text-white',
    'review': 'bg-purple-500 text-white',
    'not-answered': 'bg-red-400 text-white',
  };

  const currentClass = isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isCurrent ? 'step' : undefined}
      aria-label={`Question ${number}, ${status.replace('-', ' ')}`}
      className={`${baseClasses} ${statusClasses[status] || statusClasses['not-visited']} ${currentClass}`}
    >
      {number}
    </button>
  );
};

const StatusLegend = ({ color, label, count }) => (
    <div className="flex items-center text-sm">
        <div className={`w-4 h-4 rounded-full ${color} mr-2`}></div>
        <span>{label}</span>
        <span className="ml-1 font-semibold">({count})</span>
    </div>
);

const QuestionPalette = ({ questions, currentIndex, onQuestionSelect }) => {
  const stats = useMemo(() => {
    return {
        answered: questions.filter(q => q.status === 'answered').length,
        notAnswered: questions.filter(q => q.status === 'not-answered').length,
        notVisited: questions.filter(q => q.status === 'not-visited').length,
        markedForReview: questions.filter(q => q.status === 'review').length,
    }
  }, [questions]);

  return (
    <aside className="p-4 bg-white rounded-lg shadow-md lg:sticky lg:top-24">
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <h3 className="font-bold text-lg">Questions</h3>
        <div className="font-semibold text-gray-700">Total Questions: {questions.length}</div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {questions.map((q, index) => (
          <QuestionButton
            key={q.id}
            number={q.id}
            status={q.status}
            isCurrent={index === currentIndex}
            onClick={() => onQuestionSelect(index)}
          />
        ))}
      </div>

       <div className="mt-6 pt-4 border-t space-y-3">
        <StatusLegend color="bg-green-500" label="Answered" count={stats.answered} />
        <StatusLegend color="bg-red-400" label="Not Answered" count={stats.notAnswered} />
        <StatusLegend color="bg-purple-500" label="Marked for Review" count={stats.markedForReview} />
        <StatusLegend color="bg-gray-200" label="Not Visited" count={stats.notVisited} />
      </div>
    </aside>
  );
};

export default QuestionPalette;