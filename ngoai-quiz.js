let quiz = null;
let questions = [];
let currentIndex = 0;
let score = 0;
let selectedAnswers = [];
let isRandomMode = false;

window.onload = function () {
  const quizId = Number(localStorage.getItem("currentNgoaiQuizId"));
  const savedQuizzes = JSON.parse(localStorage.getItem("ngoaiSavedQuizzes")) || [];

  quiz = savedQuizzes.find(item => item.id === quizId);

  if (!quiz) {
    alert("Không tìm thấy bài quiz.");
    window.location.href = "ngoai.html";
    return;
  }

  document.getElementById("quizTitle").innerText = quiz.title;
  document.getElementById("totalNumber").innerText = quiz.questions.length;
};

function startQuiz(randomMode) {
  isRandomMode = randomMode;

  questions = randomMode
    ? shuffleArray([...quiz.questions])
    : [...quiz.questions];

  currentIndex = 0;
  score = 0;
  selectedAnswers = new Array(questions.length).fill(null);

  document.getElementById("scoreText").innerText = score;
  document.getElementById("totalNumber").innerText = questions.length;

  document.getElementById("modeBox").style.display = "none";
  document.getElementById("quizContent").style.display = "block";

  showQuestion();
  renderQuestionNav();
}

function showQuestion() {
  const q = questions[currentIndex];
  const savedAnswer = selectedAnswers[currentIndex];

  document.getElementById("currentNumber").innerText = currentIndex + 1;
  document.getElementById("questionText").innerText = q.question;

  document.getElementById("answerA").innerText = q.options.A;
  document.getElementById("answerB").innerText = q.options.B;
  document.getElementById("answerC").innerText = q.options.C;
  document.getElementById("answerD").innerText = q.options.D;

  document.getElementById("feedbackBox").innerHTML = "";
  document.getElementById("nextBtn").disabled = savedAnswer ? false : true;

  const buttons = document.querySelectorAll(".play-answer");

  buttons.forEach(btn => {
    btn.classList.remove("correct-answer", "wrong-answer", "selected-answer");
    btn.disabled = false;
  });

  if (savedAnswer) {
    showSavedAnswer(savedAnswer.selected);
  }

  renderQuestionNav();
}

function chooseAnswer(choice) {
  const q = questions[currentIndex];
  const correct = q.correctAnswer;

  selectedAnswers[currentIndex] = {
    question: q.question,
    options: q.options,
    selected: choice,
    correct: correct
  };

  calculateScore();
  showSavedAnswer(choice);

  document.getElementById("scoreText").innerText = score;
  document.getElementById("nextBtn").disabled = false;

  renderQuestionNav();
}

function showSavedAnswer(choice) {
  const q = questions[currentIndex];
  const correct = q.correctAnswer;

  const buttons = document.querySelectorAll(".play-answer");

  buttons.forEach(btn => {
    btn.classList.remove("correct-answer", "wrong-answer", "selected-answer");
    btn.disabled = false;
  });

  const selectedBtn = getButtonByChoice(choice);
  const correctBtn = getButtonByChoice(correct);

  if (selectedBtn) {
    selectedBtn.classList.add("selected-answer");
  }

  if (choice === correct) {
    if (selectedBtn) {
      selectedBtn.classList.add("correct-answer");
    }

    document.getElementById("feedbackBox").innerHTML =
      `<div class="feedback correct-feedback">
        ✅ Chính xác! Đáp án đúng là ${correct}.
      </div>`;
  } else {
    if (selectedBtn) {
      selectedBtn.classList.add("wrong-answer");
    }

    if (correctBtn) {
      correctBtn.classList.add("correct-answer");
    }

    document.getElementById("feedbackBox").innerHTML =
      `<div class="feedback wrong-feedback">
        ❌ Sai. Đáp án đúng là ${correct}.
      </div>`;
  }
}

function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    showQuestion();
  } else {
    finishQuiz();
  }
}

function goToQuestion(index) {
  currentIndex = index;
  showQuestion();
}

function renderQuestionNav() {
  const nav = document.getElementById("questionNav");

  if (!nav) return;

  nav.innerHTML = "";

  questions.forEach((q, index) => {
    const btn = document.createElement("button");
    btn.innerText = index + 1;

    if (index === currentIndex) {
      btn.classList.add("active");
    }

    const answer = selectedAnswers[index];

    if (answer) {
      if (answer.selected === answer.correct) {
        btn.classList.add("done");
      } else {
        btn.classList.add("wrong");
      }
    }

    btn.onclick = function () {
      goToQuestion(index);
    };

    nav.appendChild(btn);
  });
}

function calculateScore() {
  score = selectedAnswers.filter(item => {
    return item && item.selected === item.correct;
  }).length;
}

function finishQuiz() {
  const stage = document.getElementById("quizStage");

  let reviewHTML = "";

  selectedAnswers.forEach((item, index) => {
    const q = questions[index];

    reviewHTML += `
      <div class="review-question">
        <h3>Câu ${index + 1}. ${q.question}</h3>
        <p>A. ${q.options.A}</p>
        <p>B. ${q.options.B}</p>
        <p>C. ${q.options.C}</p>
        <p>D. ${q.options.D}</p>
        <strong>Đáp án đúng: ${q.correctAnswer}</strong>
        <br>
        <span>Bạn chọn: ${item ? item.selected : "Chưa làm"}</span>
      </div>
    `;
  });

  stage.innerHTML = `
    <div class="finish-card">
      <h1>Hoàn thành quiz</h1>
      <p>Kết quả của bạn</p>
      <h2>${score} / ${questions.length}</h2>

      <button class="primary-btn" onclick="restartQuiz()">Làm lại</button>
      <button class="secondary-btn" onclick="goBack()">Quay lại thư mục</button>
    </div>

    <div class="review-panel">
      <h2>Toàn bộ đề, đáp án và lựa chọn của bạn</h2>
      ${reviewHTML}
    </div>
  `;
}

function restartQuiz() {
  currentIndex = 0;
  score = 0;
  selectedAnswers = [];

  questions = isRandomMode
    ? shuffleArray([...quiz.questions])
    : [...quiz.questions];

  selectedAnswers = new Array(questions.length).fill(null);

  const stage = document.getElementById("quizStage");

  stage.innerHTML = `
    <div id="quizContent">
      <div class="question-counter">
        <span id="currentNumber">1</span> / <span id="totalNumber">${questions.length}</span>
      </div>

      <div class="question-board">
        <h2 id="questionText">Câu hỏi</h2>
      </div>

      <div class="answer-grid">
        <button class="play-answer color-a" onclick="chooseAnswer('A')">
          <span>A</span>
          <p id="answerA"></p>
        </button>

        <button class="play-answer color-b" onclick="chooseAnswer('B')">
          <span>B</span>
          <p id="answerB"></p>
        </button>

        <button class="play-answer color-c" onclick="chooseAnswer('C')">
          <span>C</span>
          <p id="answerC"></p>
        </button>

        <button class="play-answer color-d" onclick="chooseAnswer('D')">
          <span>D</span>
          <p id="answerD"></p>
        </button>
      </div>

      <div id="feedbackBox" class="feedback-box"></div>

      <div class="play-actions">
        <button class="primary-btn" id="nextBtn" onclick="nextQuestion()" disabled>
          Câu tiếp theo
        </button>
      </div>

      <div class="question-nav-box">
        <p class="question-nav-title">Bảng số câu hỏi</p>
        <div id="questionNav" class="question-nav"></div>
      </div>
    </div>
  `;

  document.getElementById("scoreText").innerText = score;
  showQuestion();
  renderQuestionNav();
}

function getButtonByChoice(choice) {
  return document.querySelector(`.play-answer[onclick="chooseAnswer('${choice}')"]`);
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function goBack() {
  window.location.href = "ngoai.html";
}
