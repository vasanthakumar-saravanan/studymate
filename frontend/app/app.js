
// ═════════════════════════════════════════
//  STATE
// ═════════════════════════════════════════

// ═════════════════════════════════════════
//  STATE
// ═════════════════════════════════════════
const API = "https://studymate-f2bw.onrender.com";

let state = {
  topics: [],
  selectedTopic: null,
  selectedTopicIndex: null,
  quizData: [],
  currentQ: 0,
  score: 0,
  wrongItems: [],
  difficulty: "easy",
  timerInterval: null,
  timeLeft: 30,
  dashboard: JSON.parse(localStorage.getItem("sm_dashboard") || JSON.stringify({
    topicsStudied: [],
    quizzesTaken: 0,
    scores: [],
    weakAreas: []
  }))
};

// ═════════════════════════════════════════
//  NAVIGATION
// ═════════════════════════════════════════
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id + "Page").classList.add("active");
  const tabs = document.querySelectorAll(".nav-tab");
  const map = { home: 0, mindmap: 1, feynman: 2, debate: 3, tutor: 4, scenario: 5, dashboard: 6 };
  if(tabs[map[id]]) tabs[map[id]].classList.add("active");
  if (id === "dashboard") renderDashboard();
  
  const mainEl = document.querySelector("main");
  if (id === "mindmap") {
    mainEl.classList.add("wide");
  } else {
    mainEl.classList.remove("wide");
  }
}

// ═════════════════════════════════════════
//  THEME
// ═════════════════════════════════════════
let isLight = false;
function toggleTheme() {
  isLight = !isLight;
  const r = document.documentElement.style;
  if (isLight) {
    r.setProperty("--bg","#f2f5fa");
    r.setProperty("--surface","rgba(255,255,255,0.78)");
    r.setProperty("--surface2","rgba(240,243,248,0.78)");
    r.setProperty("--border","#dce2ef");
    r.setProperty("--text","#1a1f2e");
    r.setProperty("--muted","#6e7a94");
    document.querySelector(".dark-toggle").textContent = "☀️";
  } else {
    r.removeProperty("--bg");r.removeProperty("--surface");
    r.removeProperty("--surface2");r.removeProperty("--border");
    r.removeProperty("--text");r.removeProperty("--muted");
    document.querySelector(".dark-toggle").textContent = "🌙";
  }
}

// ═════════════════════════════════════════
//  TOAST
// ═════════════════════════════════════════
function showToast(msg, duration = 3000) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), duration);
}

// ═════════════════════════════════════════
//  UPLOAD
// ═════════════════════════════════════════
function handleFileSelect(input) {
  const file = input.files[0];
  if (file) {
    document.getElementById("fileName").textContent = "📎 " + file.name;
  }
}

// Drag & drop
const zone = document.getElementById("uploadZone");
zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
zone.addEventListener("drop", e => {
  e.preventDefault(); zone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.type === "application/pdf") {
    document.getElementById("pdfFile").files = e.dataTransfer.files;
    handleFileSelect(document.getElementById("pdfFile"));
  }
});

async function uploadPDF() {
  const file = document.getElementById("pdfFile").files[0];
  if (!file) { showToast("⚠ Please select a PDF first"); return; }

  const btn = document.getElementById("uploadBtn");
  btn.disabled = true; btn.textContent = "Uploading…";

  // Animate progress bar
  const prog = document.getElementById("uploadProgress");
  const bar = document.getElementById("uploadProgressBar");
  prog.style.display = "block"; bar.style.width = "0%";
  let pv = 0;
  const fakeProgress = setInterval(() => {
    pv = Math.min(pv + Math.random() * 12, 85);
    bar.style.width = pv + "%";
  }, 220);

  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API}/upload-pdf/`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Upload failed");

    clearInterval(fakeProgress);
    bar.style.width = "100%";
    setTimeout(() => { prog.style.display = "none"; }, 700);

    renderTopics(data.detected_topics);
    renderDebateTopics();
    if(typeof renderScenarioTopics !== "undefined") {
      renderScenarioTopics();
    }
    showToast("✅ PDF uploaded! " + data.detected_topics.length + " topics found");
  } catch (err) {
    clearInterval(fakeProgress);
    prog.style.display = "none";
    showToast("❌ " + (err.message || "Upload failed. Is the server running?"));
    console.error(err);
  } finally {
    btn.disabled = false; btn.textContent = "⬆ Upload PDF";
  }
}

function renderTopics(topics) {
  state.topics = topics;
  const grid = document.getElementById("topicsGrid");
  grid.innerHTML = "";
  topics.forEach((t, i) => {
    const chip = document.createElement("button");
    chip.className = "topic-chip";
    chip.innerHTML = `<span>📌</span> ${t}`;
    chip.onclick = () => openKnowledgeCheck(i);
    grid.appendChild(chip);
  });
  document.getElementById("topicsCard").style.display = "block";
}

// ═════════════════════════════════════════
//  DIFFICULTY
// ═════════════════════════════════════════
function setDifficulty(btn) {
  document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.difficulty = btn.dataset.d;
}

// ═════════════════════════════════════════
//  KNOWLEDGE CHECK MODAL
// ═════════════════════════════════════════
function openKnowledgeCheck(index) {
  state.selectedTopicIndex = index;
  state.selectedTopic = state.topics[index];
  document.getElementById("knowTopicName").textContent = state.selectedTopic;
  document.getElementById("knowModal").classList.add("show");
}

function startWithKnowledge(knows) {
  document.getElementById("knowModal").classList.remove("show");
  if (knows) {
    startQuiz();
  } else {
    explainTopic();
  }
}

function closeKnowledgeCheck() {
  document.getElementById("knowModal").classList.remove("show");
}

// ═════════════════════════════════════════
//  EXPLAIN FIRST
// ═════════════════════════════════════════
async function explainTopic() {
  showPage("tutor");
  const card = document.getElementById("explanationCard");
  const loader = document.getElementById("explainLoader");
  const content = document.getElementById("explanationContent");
  card.style.display = "block";
  loader.classList.add("show");
  content.innerHTML = "";

  try {
    const res = await fetch(`${API}/explain-topic/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: state.selectedTopic })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Explanation failed");

    loader.classList.remove("show");
    content.innerHTML = marked.parse(data.explanation || "");
  } catch (err) {
    loader.classList.remove("show");
    content.innerHTML = `<em style="color:var(--red)">❌ ${err.message || "Failed to load explanation."}</em>`;
  }
}

function startQuizFromExplanation() {
  document.getElementById("explanationCard").style.display = "none";
  // Don't navigate to home — go directly to quiz
  startQuiz();
}

// ═════════════════════════════════════════
//  QUIZ
// ═════════════════════════════════════════
async function startQuiz() {
  const btn = document.querySelectorAll(".topic-chip")[state.selectedTopicIndex];
  if (btn) { btn.style.opacity = ".6"; btn.style.pointerEvents = "none"; }

  showToast("⏳ Generating quiz…");

  try {
    const res = await fetch(`${API}/quiz/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: state.selectedTopic, difficulty: state.difficulty })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Quiz generation failed");
    if (btn) { btn.style.opacity = ""; btn.style.pointerEvents = ""; }

    if (!data.quiz || data.quiz.length === 0) {
      showToast("⚠ Could not generate quiz. Try again."); return;
    }

    state.quizData = data.quiz;
    state.currentQ = 0;
    state.score = 0;
    state.wrongItems = [];

    // Hide score/home, show quiz
    document.getElementById("homePage").style.display = "none";
    document.getElementById("scoreScreen").style.display = "none";
    document.getElementById("quizPage").style.display = "block";

    document.getElementById("quizTopicLabel").textContent = "📌 " + state.selectedTopic;
    document.getElementById("qTotal").textContent = state.quizData.length;

    renderQuestion();
  } catch (err) {
    if (btn) { btn.style.opacity = ""; btn.style.pointerEvents = ""; }
    showToast("❌ " + (err.message || "Failed to generate quiz. Is the server running?"));
    console.error(err);
  }
}

const TIMER_SECONDS = 30;
const CIRC = 2 * Math.PI * 22; // circumference

function renderQuestion() {
  clearInterval(state.timerInterval);

  const q = state.quizData[state.currentQ];
  const total = state.quizData.length;
  const letters = ["A","B","C","D","E"];

  document.getElementById("questionNumber").textContent = `QUESTION ${state.currentQ + 1}`;
  document.getElementById("qNum").textContent = state.currentQ + 1;
  document.getElementById("questionText").textContent = q.question;
  document.getElementById("progressFill").style.width = ((state.currentQ / total) * 100) + "%";

  const list = document.getElementById("optionsList");
  list.innerHTML = "";
  q.options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "option";
    div.innerHTML = `
      <input type="radio" name="opt" value="${opt}">
      <div class="opt-letter">${letters[i]}</div>
      <div class="opt-text">${opt}</div>`;
    div.onclick = () => selectOption(div, opt);
    list.appendChild(div);
  });

  document.getElementById("nextBtn").disabled = true;
  startTimer();
}

function selectOption(el, val) {
  document.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
  el.classList.add("selected");
  el.querySelector("input").checked = true;
  document.getElementById("nextBtn").disabled = false;
}

function startTimer() {
  state.timeLeft = TIMER_SECONDS;
  updateTimerDisplay(TIMER_SECONDS);
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateTimerDisplay(state.timeLeft);
    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      autoAdvance();
    }
  }, 1000);
}

function updateTimerDisplay(t) {
  const arc = document.getElementById("timerArc");
  const lbl = document.getElementById("timerLabel");
  const offset = CIRC * (1 - t / TIMER_SECONDS);
  arc.style.strokeDashoffset = offset;
  lbl.textContent = t;

  if (t <= 10) arc.style.stroke = "var(--red)";
  else if (t <= 20) arc.style.stroke = "var(--amber)";
  else arc.style.stroke = "var(--green)";
}

function autoAdvance() {
  // No selection = wrong
  const q = state.quizData[state.currentQ];
  state.wrongItems.push({ question: q.question, correct: q.answer });
  document.getElementById("nextBtn").disabled = false;
  nextQuestion(true);
}

function nextQuestion(auto = false) {
  clearInterval(state.timerInterval);

  if (!auto) {
    const selected = document.querySelector('input[name="opt"]:checked');
    if (!selected) { showToast("⚠ Please select an answer"); return; }

    const q = state.quizData[state.currentQ];
    if (selected.value === q.answer) {
      state.score++;
    } else {
      state.wrongItems.push({ question: q.question, yourAnswer: selected.value, correct: q.answer });
    }
    // Visual feedback — highlight correct & wrong before advancing
    const opts = document.querySelectorAll(".option");
    opts.forEach(o => {
      const v = o.querySelector("input").value;
      if (v === q.answer) o.classList.add("correct");
      else if (o.querySelector("input").checked) o.classList.add("wrong");
      o.style.pointerEvents = "none";
    });
    document.getElementById("nextBtn").disabled = true;
    setTimeout(() => advanceQuestion(), 700);
    return;
  }
  advanceQuestion();
}

function advanceQuestion() {
  state.currentQ++;
  if (state.currentQ >= state.quizData.length) {
    showScore();
  } else {
    renderQuestion();
  }
}

function showScore() {
  document.getElementById("quizPage").style.display = "none";
  const ss = document.getElementById("scoreScreen");
  ss.style.display = "block";

  const total = state.quizData.length;
  const pct = Math.round((state.score / total) * 100);

  document.getElementById("scoreNum").textContent = state.score;
  document.getElementById("scoreDenom").textContent = "/ " + total;
  document.getElementById("scorePct").textContent = pct + "% correct";

  let msg = "Keep Practising 💪";
  if (pct >= 90) msg = "Outstanding! 🏆";
  else if (pct >= 70) msg = "Great Work! 🎉";
  else if (pct >= 50) msg = "Good Effort 👍";
  document.getElementById("scoreMsg").textContent = msg;

  // Weak items
  const wl = document.getElementById("weakList");
  const wi = document.getElementById("weakItems");
  if (state.wrongItems.length > 0) {
    wl.style.display = "block";
    wi.innerHTML = state.wrongItems.map(w =>
      `<div class="weak-item"><div><div style="font-weight:500">${w.question}</div><div style="font-size:.8rem;color:var(--muted);margin-top:3px">Correct: <span style="color:var(--green)">${w.correct}</span>${w.yourAnswer ? ` · Your answer: <span style="color:var(--red)">${w.yourAnswer}</span>` : " (timed out)"}</div></div></div>`
    ).join("");
    document.getElementById("practiceWeakBtn").style.display = "inline-flex";
  } else {
    wl.style.display = "none";
    document.getElementById("practiceWeakBtn").style.display = "none";
  }

  if (pct >= 70) fireworks();
  saveDashboard(total, pct);
}

function fireworks() {
  const opts = { particleCount: 120, spread: 80, origin: { y: 0.55 },
    colors: ["#3bdc8c","#5be8c0","#f5c842","#5b9af5"] };
  confetti(opts);
  setTimeout(() => confetti({ ...opts, origin: { x: 0.1, y: 0.6 } }), 400);
  setTimeout(() => confetti({ ...opts, origin: { x: 0.9, y: 0.6 } }), 700);
}

function retryQuiz() {
  state.score = 0;
  state.currentQ = 0;
  state.wrongItems = [];
  document.getElementById("scoreScreen").style.display = "none";
  document.getElementById("homePage").style.display = "none";
  document.getElementById("quizPage").style.display = "block";
  document.getElementById("qTotal").textContent = state.quizData.length;
  document.getElementById("quizTopicLabel").textContent = "📌 " + state.selectedTopic;
  renderQuestion();
}

function practiceWeak() {
  if (state.wrongItems.length === 0) return;
  // Rebuild quiz from wrong questions only
  const wrongQs = state.wrongItems.map(w => w.question);
  state.quizData = state.quizData.filter(q => wrongQs.includes(q.question));
  state.score = 0;
  state.currentQ = 0;
  state.wrongItems = [];
  document.getElementById("scoreScreen").style.display = "none";
  document.getElementById("quizPage").style.display = "block";
  document.getElementById("qTotal").textContent = state.quizData.length;
  renderQuestion();
}



function exitQuiz() {
  clearInterval(state.timerInterval);
  document.getElementById("quizPage").style.display = "none";
  document.getElementById("scoreScreen").style.display = "none";
  document.getElementById("homePage").style.display = "block";
}

function backToTopics() {
  document.getElementById("scoreScreen").style.display = "none";
  document.getElementById("homePage").style.display = "block";
}

function learnAgain() {
  document.getElementById("scoreScreen").style.display = "none";
  document.getElementById("quizPage").style.display = "none";
  document.getElementById("homePage").style.display = "block";
  explainTopic();
}

// ═════════════════════════════════════════
//  AI TUTOR
// ═════════════════════════════════════════
async function askTutor() {
  const q = document.getElementById("tutorQuestion").value.trim();
  if (!q) { showToast("⚠ Please type a question"); return; }

  const ans = document.getElementById("tutorAnswer");
  const thinking = document.getElementById("thinkingIndicator");
  ans.style.display = "none";
  ans.innerHTML = "";
  thinking.classList.add("show");

  try {
    const res = await fetch(`${API}/ai-tutor/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "AI Tutor failed");

    thinking.classList.remove("show");
    ans.style.display = "block";
    ans.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
      <strong style="color:var(--green)">Answer:</strong>
      <button class="btn btn-outline" style="padding:2px 8px; font-size:0.75rem;" onclick="speakText(this.parentElement.nextElementSibling.innerText)">🔊 Read</button>
    </div>
    <div>${marked.parse(data.answer || "No answer returned.")}</div>`;
  } catch (err) {
    thinking.classList.remove("show");
    ans.style.display = "block";
    ans.innerHTML = `<em style='color:var(--red)'>❌ ${err.message || "Failed to connect to server."}</em>`;
  }
}

// ═════════════════════════════════════════
//  DASHBOARD
// ═════════════════════════════════════════
function saveDashboard(total, pct) {
  const d = state.dashboard;
  if (state.selectedTopic && !d.topicsStudied.includes(state.selectedTopic))
    d.topicsStudied.push(state.selectedTopic);
  d.quizzesTaken++;
  d.scores.push(pct);
  if (state.wrongItems.length > 0) {
    state.wrongItems.forEach(w => {
      if (!d.weakAreas.includes(w.question)) d.weakAreas.push(w.question);
    });
  }
  localStorage.setItem("sm_dashboard", JSON.stringify(d));
  state.dashboard = d;
}

function renderDashboard() {
  const d = state.dashboard;
  const avg = d.scores.length ? Math.round(d.scores.reduce((a,b)=>a+b,0)/d.scores.length) : null;
  document.getElementById("dashTopics").textContent = d.topicsStudied.length;
  document.getElementById("dashQuizzes").textContent = d.quizzesTaken;
  document.getElementById("dashAvg").textContent = avg !== null ? avg + "%" : "—";
  document.getElementById("dashWeak").textContent = d.weakAreas.length;

  // Revision plan
  const rp = document.getElementById("revisionPlan");
  if (d.topicsStudied.length === 0) {
    rp.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div>Complete a quiz to generate your revision plan</div>`;
  } else {
    rp.innerHTML = `<h4>📅 Your Personalised Plan</h4>` +
      d.topicsStudied.map((t, i) => `
        <div class="revision-item">
          <span class="rev-icon">${["📖","✍","🔁","🎯","⭐"][i % 5]}</span>
          <div><div style="font-weight:500">${t}</div><div style="font-size:.78rem;color:var(--muted)">Day ${i+1} — ${i === 0 ? "Review & quiz" : "Practice problems"}</div></div>
        </div>`).join("");
  }

  // Weak areas
  const wa = document.getElementById("weakAreasList");
  if (d.weakAreas.length === 0) {
    wa.innerHTML = `<div class="empty-state"><div class="empty-icon">🎉</div>No weak areas yet — keep going!</div>`;
  } else {
    wa.innerHTML = d.weakAreas.slice(0, 8).map(q =>
      `<div class="weak-item" style="padding:10px 0;border-bottom:1px solid var(--border)">${q}</div>`
    ).join("");
  }
}

// ═════════════════════════════════════════
//  TEXT TO SPEECH (TTS)
// ═════════════════════════════════════════
function speakText(text) {
  if (!window.speechSynthesis) {
    showToast("⚠ Text-to-speech not supported in this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  const stripped = text.replace(/<[^>]+>/g, '').replace(/[\*\_\[\]\#\`]/g, '');
  const utterance = new SpeechSynthesisUtterance(stripped);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

// ═════════════════════════════════════════
//  MIND MAP
// ═════════════════════════════════════════
async function generateMindmap() {
  if (state.topics.length === 0) {
    showToast("⚠ Please upload a PDF first to generate a mind map.");
    return;
  }
  const loader = document.getElementById("mindmapLoader");
  const container = document.getElementById("mindmapContainer");
  loader.style.display = "flex";
  container.innerHTML = "";

  try {
    const res = await fetch(`${API}/generate-mindmap/`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Mind map generation failed");

    loader.style.display = "none";
    if (data.mindmap) {
      container.innerHTML = `<div class="mermaid">${data.mindmap}</div>`;
      mermaid.initialize({ startOnLoad: false, theme: isLight ? 'default' : 'dark' });
      // Correct v10+ async call for Mermaid
      await mermaid.run({ querySelector: '.mermaid' }).catch(e => {
          console.error("Mermaid error:", e);
          container.innerHTML += `<div style="color:var(--amber);margin-top:10px;text-align:center;">Note: AI generated a slightly malformed graph, but we tried to render it.</div>`;
      });
    } else {
      container.innerHTML = `<div style="color:var(--red);text-align:center;padding:20px;">Failed to generate map.</div>`;
    }
  } catch (err) {
    loader.style.display = "none";
    container.innerHTML = `<div style="color:var(--red);text-align:center;padding:20px;">❌ ${err.message || "Error connecting to server."}</div>`;
  }
}

// ═════════════════════════════════════════
//  MIND MAP DRAG TO SCROLL
// ═════════════════════════════════════════
const ele = document.getElementById('mindmapContainer');
ele.style.cursor = 'grab';

let pos = { top: 0, left: 0, x: 0, y: 0 };

const mouseDownHandler = function(e) {
    ele.style.cursor = 'grabbing';
    ele.style.userSelect = 'none';
    pos = {
        left: ele.scrollLeft,
        top: ele.scrollTop,
        x: e.clientX,
        y: e.clientY,
    };
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
};

const mouseMoveHandler = function(e) {
    const dx = e.clientX - pos.x;
    const dy = e.clientY - pos.y;
    ele.scrollTop = pos.top - dy;
    ele.scrollLeft = pos.left - dx;
};

const mouseUpHandler = function() {
    ele.style.cursor = 'grab';
    ele.style.removeProperty('user-select');
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
};

ele.addEventListener('mousedown', mouseDownHandler);

// ═════════════════════════════════════════
//  FEYNMAN TECHNIQUE
// ═════════════════════════════════════════
async function submitFeynman() {
  const topic = document.getElementById("feynmanTopic").value.trim();
  const exp = document.getElementById("feynmanExplanation").value.trim();
  if (!topic || !exp) { showToast("⚠ Please enter a topic and an explanation."); return; }

  const loader = document.getElementById("feynmanLoader");
  const feedback = document.getElementById("feynmanFeedback");
  loader.style.display = "flex";
  feedback.style.display = "none";

  try {
    const res = await fetch(`${API}/feynman-evaluate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topic, explanation: exp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Evaluation failed");

    loader.style.display = "none";
    feedback.style.display = "block";
    if (data.feedback) {
      feedback.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
        <h4 style="color:var(--green); margin:0;">AI Feedback</h4>
        <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="speakText(this.parentElement.nextElementSibling.innerText)">🔊 Read</button>
      </div>
      <div>${marked.parse(data.feedback)}</div>`;
    } else {
      feedback.innerHTML = `<em style='color:var(--red)'>No feedback returned.</em>`;
    }
  } catch (err) {
    loader.style.display = "none";
    feedback.style.display = "block";
    feedback.innerHTML = `<em style='color:var(--red)'>❌ ${err.message || "Failed to connect to server."}</em>`;
  }
}

// ═════════════════════════════════════════
//  DEBATE AI
// ═════════════════════════════════════════
function renderDebateTopics() {
  const container = document.getElementById("debateTopicsList");
  if (state.topics.length === 0) return;
  
  container.innerHTML = state.topics.map(t => 
    `<button class="topic-chip" onclick="startDebate('${t}')"><span>💬</span> ${t}</button>`
  ).join("");
}

let activeDebateTopic = "";

async function startDebate(topic) {
  activeDebateTopic = topic;
  const arena = document.getElementById("debateArena");
  const stanceText = document.getElementById("debateStanceText");
  const loader = document.getElementById("debateLoader");
  const loaderText = document.getElementById("debateLoaderText");
  const feedback = document.getElementById("debateFeedback");
  const topicChips = document.getElementById("debateTopicsList").querySelectorAll(".topic-chip");
  
  topicChips.forEach(chip => {
    chip.style.opacity = chip.textContent.includes(topic) ? "1" : "0.5";
    chip.style.borderColor = chip.textContent.includes(topic) ? "var(--green)" : "var(--border)";
  });
  
  arena.style.display = "block";
  stanceText.innerHTML = "";
  feedback.style.display = "none";
  document.getElementById("debateRebuttal").value = "";
  
  loaderText.textContent = "AI is preparing its flawed argument…";
  loader.style.display = "flex";
  
  try {
    const res = await fetch(`${API}/debate-start/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topic })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Debate start failed");
    
    loader.style.display = "none";
    stanceText.innerHTML = marked.parse(data.stance);
  } catch (err) {
    loader.style.display = "none";
    stanceText.innerHTML = `<em style='color:var(--red)'>❌ ${err.message || "Failed to start debate."}</em>`;
  }
}

async function submitDebateRebuttal() {
  const rebuttal = document.getElementById("debateRebuttal").value.trim();
  if (!rebuttal) { showToast("⚠ Please enter your counter-argument."); return; }
  
  const loader = document.getElementById("debateLoader");
  const loaderText = document.getElementById("debateLoaderText");
  const feedback = document.getElementById("debateFeedback");
  
  feedback.style.display = "none";
  loaderText.textContent = "AI is evaluating your rebuttal…";
  loader.style.display = "flex";
  
  try {
    const res = await fetch(`${API}/debate-rebuttal/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: activeDebateTopic, rebuttal: rebuttal })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Debate rebuttal failed");
    
    loader.style.display = "none";
    feedback.style.display = "block";
    feedback.style.borderLeft = "3px solid var(--blue)";
    feedback.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
      <h4 style="color:var(--blue); margin:0;">AI's Response to You</h4>
      <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="speakText(this.parentElement.nextElementSibling.innerText)">🔊 Read</button>
    </div>
    <div>${marked.parse(data.feedback)}</div>`;
  } catch (err) {
    loader.style.display = "none";
    feedback.style.display = "block";
    feedback.innerHTML = `<em style='color:var(--red)'>❌ ${err.message || "Failed to submit rebuttal."}</em>`;
  }
}

// ═════════════════════════════════════════
//  SCENARIO SIMULATOR
// ═════════════════════════════════════════
function renderScenarioTopics() {
  const container = document.getElementById("scenarioTopicsList");
  if (state.topics.length === 0) return;
  
  container.innerHTML = state.topics.map(t => 
    `<button class="topic-chip" onclick="startScenario('${t}')"><span>🌍</span> ${t}</button>`
  ).join("");
}

let activeScenarioTopic = "";

async function startScenario(topic) {
  activeScenarioTopic = topic;
  const arena = document.getElementById("scenarioArena");
  const scenarioText = document.getElementById("scenarioText");
  const loader = document.getElementById("scenarioLoader");
  const loaderText = document.getElementById("scenarioLoaderText");
  const feedback = document.getElementById("scenarioFeedback");
  const topicChips = document.getElementById("scenarioTopicsList").querySelectorAll(".topic-chip");
  
  topicChips.forEach(chip => {
    chip.style.opacity = chip.textContent.includes(topic) ? "1" : "0.5";
    chip.style.borderColor = chip.textContent.includes(topic) ? "var(--green)" : "var(--border)";
  });
  
  arena.style.display = "block";
  scenarioText.innerHTML = "";
  feedback.style.display = "none";
  document.getElementById("scenarioAction").value = "";
  
  loaderText.textContent = "Generating a real-world scenario…";
  loader.style.display = "flex";
  
  try {
    const res = await fetch(`${API}/scenario-start/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topic })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Scenario start failed");
    
    loader.style.display = "none";
    scenarioText.innerHTML = marked.parse(data.scenario);
  } catch (err) {
    loader.style.display = "none";
    scenarioText.innerHTML = `<em style='color:var(--red)'>❌ ${err.message || "Failed to start scenario."}</em>`;
  }
}

async function submitScenarioAction() {
  const action = document.getElementById("scenarioAction").value.trim();
  if (!action) { showToast("⚠ Please enter your action/decision."); return; }
  
  const loader = document.getElementById("scenarioLoader");
  const loaderText = document.getElementById("scenarioLoaderText");
  const feedback = document.getElementById("scenarioFeedback");
  
  feedback.style.display = "none";
  loaderText.textContent = "Analyzing the consequences of your action…";
  loader.style.display = "flex";
  
  try {
    const res = await fetch(`${API}/scenario-action/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: activeScenarioTopic, action: action })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Scenario action failed");
    
    loader.style.display = "none";
    feedback.style.display = "block";
    feedback.style.borderLeft = "3px solid var(--blue)";
    feedback.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
      <h4 style="color:var(--blue); margin:0;">Outcome & Feedback</h4>
      <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="speakText(this.parentElement.nextElementSibling.innerText)">🔊 Read</button>
    </div>
    <div>${marked.parse(data.feedback)}</div>`;
  } catch (err) {
    loader.style.display = "none";
    feedback.style.display = "block";
    feedback.innerHTML = `<em style='color:var(--red)'>❌ ${err.message || "Failed to submit action."}</em>`;
  }
}




const API_URL = "https://studymate-f2bw.onrender.com";

// AUTH GUARD
function checkAuth() {
  const token = localStorage.getItem("sm_auth_token");
  if (!token) {
    window.location.href = "index.html"; // Redirect to login
  } else {
    document.getElementById('logoutBtn').style.display = 'block';
    
    // Set Dashboard User Name
    const userName = localStorage.getItem("sm_user_name");
    if (userName && document.getElementById("dashUserName")) {
      document.getElementById("dashUserName").innerText = userName;
    }
  }
}
checkAuth();

function logoutUser() {
  localStorage.removeItem("sm_auth_token");
  localStorage.removeItem("sm_user_name");
  window.location.href = "index.html";
}
