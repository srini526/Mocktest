export const examQuestions = [
  {
    id: 1,
    type: 'mcq', // Specify the type
    text: "The following question, consists of an incomplete sentence... Arrange the jumbled parts...",
    prompt: "For some people patriotism ___________________ as much as to any one country.",
    options: ["is not quite", "means an exclusive devotion", "to their own country", "as it is for others"],
    userAnswer: null,
    status: 'not-visited',
  },
  {
    id: 2,
    type: 'mcq', // Specify the type
    text: "Identify the part of the sentence that has an error.",
    prompt: "The man who has risen by his own exertions (a) / is always respected more than (b) / one who has born with a silver spoon in his mouth (c) / No error (d).",
    options: ["a", "b", "c", "d"],
    userAnswer: null,
    status: 'not-visited',
  },
  {
    id: 3,
    type: 'mcq', // Specify the type
    text: "Choose the word which is the exact OPPOSITE of the given word.",
    prompt: "EFFICACIOUS",
    options: ["Productive", "Ineffective", "Improper", "Urgent"],
    userAnswer: null,
    status: 'not-visited',
  },
  {
    id: 4,
    type: 'text', // This is our new question type
    text: "Fill in the blank with the correct preposition.",
    prompt: "He is not afraid ______ the consequences.",
    userAnswer: '', // Initial answer for text should be an empty string
    status: 'not-visited',
  },
  // Add 21 more questions to make a total of 25
  ...Array.from({ length: 21 }, (_, i) => ({
    id: i + 5,
    type: 'mcq', // All dummy questions are MCQ
    text: `This is the question text for question number ${i + 5}.`,
    prompt: `What is the correct option for question ${i + 5}?`,
    options: [`Option A`, `Option B`, `Option C`, `Option D`],
    userAnswer: null,
    status: 'not-visited',
  }))
];