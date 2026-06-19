let currentQuestions = [];

window.onload = function () {
  renderSavedQuizList();
};

function switchInput(type) {
  document.getElementById("textInputBox").style.display = type === "text" ? "block" : "none";
  document.getElementById("fileInputBox").style.display = type === "file" ? "block" : "none";

  document.getElementById("tab-text").classList.remove("active");
  document.getElementById("tab-file").classList.remove("active");

  document.getElementById("tab-" + type).classList.add("active");
}

async function handleInput() {
  const file = document.getElementById("fileUpload").files[0];
  let text = document.getElementById("rawInput").value.trim();

  if (file) {
    text = await readFile(file);
    document.getElementById("rawInput").value = text;
  }

  if (!text) {
    alert("Bạn chưa dán text hoặc upload file.");
    return;
  }

  currentQuestions = parseMCQ(text);
  renderPreview();
}

async function readFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();

  if (extension === "txt") {
    return await file.text();
  }

  if (extension === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (extension === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(" ");
      text += pageText + "\n";
    }

    return text;
  }

  alert("File chưa được hỗ trợ.");
  return "";
}

function parseMCQ(text) {
  const cleanedText = text
    .replace(/\r/g, "")
    .replace(/Đáp án đúng/gi, "Đáp án")
    .replace(/Answer/gi, "Đáp án");

  const blocks = cleanedText
    .split(/(?=Câu\s*\d+[\.\:])/gi)
    .filter(block => block.trim() !== "");

  const questions = blocks.map((block, index) => {
    const questionMatch = block.match(/Câu\s*\d+[\.\:]\s*([\s\S]*?)(?=\n?\s*A[\.\)]\s*)/i);

    const question = questionMatch
      ? questionMatch[1].trim()
      : block.split("\n")[0].trim();

    const optionA = extractOption(block, "A");
    const optionB = extractOption(block, "B");
    const optionC = extractOption(block, "C");
    const optionD = extractOption(block, "D");

    const answerMatch = block.match(/Đáp án\s*[:\-]?\s*([ABCD])/i);
    const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : "";

    return {
      id: index + 1,
      question,
      options: {
        A: optionA,
        B: optionB,
        C: optionC,
        D: optionD
      },
      correctAnswer
    };
  });

  return questions.filter(q =>
    q.question &&
    q.options.A &&
    q.options.B &&
    q.options.C &&
    q.options.D
  );
}

function extractOption(block, letter) {
  const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);

  let regex;

  if (letter !== "D") {
    regex = new RegExp(`${letter}[\\.\\)]\\s*([\\s\\S]*?)(?=\\n?\\s*${nextLetter}[\\.\\)])`, "i");
  } else {
    regex = new RegExp(`${letter}[\\.\\)]\\s*([\\s\\S]*?)(?=\\n?\\s*Đáp án|$)`, "i");
  }

  const match = block.match(regex);
  return match ? match[1].trim() : "";
}

function renderPreview() {
  document.getElementById("questionCount").innerText = currentQuestions.length;
  document.getElementById("statusText").innerText = currentQuestions.length > 0 ? "Đã đọc" : "Lỗi";

  const preview = document.getElementById("questionPreview");
  preview.innerHTML = "";

  if (currentQuestions.length === 0) {
    preview.innerHTML = `<p class="muted-text">Không đọc được câu hỏi. Kiểm tra lại format đề.</p>`;
    return;
  }

  currentQuestions.forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "preview-item";

    div.innerHTML = `
      <h3>Câu ${index + 1}. ${q.question}</h3>
      <p>A. ${q.options.A}</p>
      <p>B. ${q.options.B}</p>
      <p>C. ${q.options.C}</p>
      <p>D. ${q.options.D}</p>
      <strong>Đáp án: ${q.correctAnswer || "Chưa nhận diện"}</strong>
    `;

    preview.appendChild(div);
  });
}

function saveQuiz() {
  const title = document.getElementById("quizTitle").value.trim();

  if (!title) {
    alert("Bạn cần nhập tên bài quiz.");
    return;
  }

  if (currentQuestions.length === 0) {
    alert("Bạn cần đọc dữ liệu trước khi lưu.");
    return;
  }

  const savedQuizzes = JSON.parse(localStorage.getItem("noiSavedQuizzes")) || [];

  const newQuiz = {
    id: Date.now(),
    title,
    subject: "Nội bệnh lý",
    total: currentQuestions.length,
    createdAt: new Date().toLocaleString("vi-VN"),
    questions: currentQuestions
  };

  savedQuizzes.unshift(newQuiz);

  localStorage.setItem("noiSavedQuizzes", JSON.stringify(savedQuizzes));

  alert("Đã lưu bài quiz vào thư mục.");

  document.getElementById("quizTitle").value = "";
  renderSavedQuizList();
}

function renderSavedQuizList() {
  const list = document.getElementById("savedQuizList");
  const savedQuizzes = JSON.parse(localStorage.getItem("noiSavedQuizzes")) || [];

  list.innerHTML = "";

  if (savedQuizzes.length === 0) {
    list.innerHTML = `
      <div class="empty-card">
        <h3>Chưa có bài quiz nào được lưu</h3>
        <p>Sau khi đọc dữ liệu và bấm lưu, bài quiz sẽ xuất hiện ở đây.</p>
      </div>
    `;
    return;
  }

  savedQuizzes.forEach(quiz => {
    const div = document.createElement("div");
    div.className = "saved-quiz-card";

    div.innerHTML = `
      <div class="saved-icon">📘</div>
      <h3>${quiz.title}</h3>
      <p>${quiz.subject}</p>
      <span>${quiz.total} câu hỏi</span>
      <small>${quiz.createdAt}</small>

      <div class="button-row">
        <button class="primary-btn" onclick="startQuiz(${quiz.id})">Làm quiz</button>
        <button class="secondary-btn" onclick="deleteQuiz(${quiz.id})">Xóa</button>
      </div>
    `;

    list.appendChild(div);
  });
}

function startQuiz(id) {
  localStorage.setItem("currentNoiQuizId", id);
  window.location.href = "noi-quiz.html";
}

function deleteQuiz(id) {
  let savedQuizzes = JSON.parse(localStorage.getItem("noiSavedQuizzes")) || [];
  savedQuizzes = savedQuizzes.filter(quiz => quiz.id !== id);
  localStorage.setItem("noiSavedQuizzes", JSON.stringify(savedQuizzes));
  renderSavedQuizList();
}

function clearInput() {
  document.getElementById("rawInput").value = "";
  document.getElementById("fileUpload").value = "";
  currentQuestions = [];
  renderPreview();
}