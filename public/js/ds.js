const allQuestions = [
  {
    question_text: "Create a structure as shown: struct DISTANCE...",
    difficulty: "hard"
  },
  {
    question_text: "Check whether the given string is palindrome using recursion.",
    difficulty: "medium"
  },
  {
    question_text: "Output of the following C code...",
    difficulty: "easy"
  },
  // Add more from your dataset
];

function filterQuestions(level) {
  const container = document.getElementById("question-list");
  container.innerHTML = "";

  const filtered = allQuestions.filter(q => q.difficulty.toLowerCase() === level);
  if (filtered.length === 0) {
    container.innerHTML = `<p style="text-align:center;">No ${level} questions found.</p>`;
    return;
  }

  filtered.forEach(q => {
    const div = document.createElement("div");
    div.className = "question-card";
    div.textContent = q.question_text;
    container.appendChild(div);
  });
}
