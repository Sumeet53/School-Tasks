/* =========================================================
   0. FIREBASE SETUP
   ========================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyADL-_-NBH55fb37CLUrllyZmKEsh8Bmno",
  authDomain: "schooltasks-app.firebaseapp.com",
  projectId: "schooltasks-app",
  storageBucket: "schooltasks-app.firebasestorage.app",
  messagingSenderId: "483992809144",
  appId: "1:483992809144:web:b989a0b80f6be8de2a4e4d"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

let currentUid = null;
let unsubStudents = null;
let unsubTasks = null;

/* =========================================================
   1. LOGIN SCREEN
   ========================================================= */
let loginMode = "login"; // "login" or "signup"

function setupLoginScreen() {
  const form = document.getElementById("login-form");
  const toggleBtn = document.getElementById("login-toggle-mode");
  const subtitle = document.getElementById("login-mode-subtitle");
  const submitBtn = document.getElementById("login-submit-btn");
  const errorEl = document.getElementById("login-error");

  toggleBtn.addEventListener("click", () => {
    loginMode = loginMode === "login" ? "signup" : "login";
    if (loginMode === "signup") {
      subtitle.textContent = "Create your family account";
      submitBtn.textContent = "Create Account";
      toggleBtn.textContent = "Already have an account? Log in";
    } else {
      subtitle.textContent = "Log in to your family account";
      submitBtn.textContent = "Log In";
      toggleBtn.textContent = "New family? Create an account";
    }
    errorEl.hidden = true;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const action = loginMode === "signup"
      ? createUserWithEmailAndPassword(auth, email, password)
      : signInWithEmailAndPassword(auth, email, password);

    action.catch((err) => {
      errorEl.textContent = humanizeAuthError(err.code);
      errorEl.hidden = false;
    });
  });
}

function humanizeAuthError(code) {
  if (code === "auth/email-already-in-use") return "That email is already registered — try logging in instead.";
  if (code === "auth/invalid-email") return "Please enter a valid email address.";
  if (code === "auth/weak-password") return "Password should be at least 6 characters.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") return "Incorrect email or password.";
  if (code === "auth/user-not-found") return "No account found with that email.";
  return "Something went wrong. Please try again.";
}

function setupLogout() {
  document.getElementById("nav-logout").addEventListener("click", () => {
    if (confirm("Log out of SchoolTasks?")) {
      signOut(auth);
    }
  });
}

/* =========================================================
   2. AUTH STATE -> SHOW LOGIN OR APP
   ========================================================= */
onAuthStateChanged(auth, (user) => {
  const loginScreen = document.getElementById("login-screen");
  const appRoot = document.getElementById("app-root");

  if (user) {
    currentUid = user.uid;
    loginScreen.hidden = true;
    appRoot.hidden = false;
    attachFirestoreListeners();
  } else {
    currentUid = null;
    if (unsubStudents) unsubStudents();
    if (unsubTasks) unsubTasks();
    students = [];
    tasks = [];
    currentStudentId = null;
    loginScreen.hidden = false;
    appRoot.hidden = true;
    document.getElementById("login-form").reset();
  }
});

/* =========================================================
   3. STUDENTS & TASKS (now backed by Firestore)
   ========================================================= */
let students = [];
let tasks = [];
let currentStudentId = null;

function attachFirestoreListeners() {
  const studentsRef = collection(db, "families", currentUid, "students");
  unsubStudents = onSnapshot(studentsRef, (snapshot) => {
    students = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!currentStudentId || !students.find(s => s.id === currentStudentId)) {
      currentStudentId = students.length ? students[0].id : null;
    }
    renderStudentSwitcher();
    renderAll();
  });

  const tasksRef = collection(db, "families", currentUid, "tasks");
  unsubTasks = onSnapshot(tasksRef, (snapshot) => {
    tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAll();
  });
}

function getCurrentStudent() {
  return students.find(s => s.id === currentStudentId);
}

function getStudentTasks() {
  return tasks.filter(t => t.studentId === currentStudentId);
}

function genderAvatar(gender) {
  return gender === "Girl" ? "👧" : "👦";
}

function renderStudentSwitcher() {
  const student = getCurrentStudent();
  document.getElementById("student-avatar").textContent =
    student ? genderAvatar(student.gender) : "🧒";
  document.getElementById("student-switcher-label").textContent =
    student ? `${student.name} — ${student.className}` : "Add a student";
}

function renderStudentDropdown() {
  const list = document.getElementById("student-dropdown-list");
  list.innerHTML = students.map(s => `
    <div class="student-dropdown-item ${s.id === currentStudentId ? "active" : ""}" data-id="${s.id}">
      ${genderAvatar(s.gender)} ${s.name} — ${s.className}
    </div>
  `).join("") || `<div class="student-dropdown-item">No students yet — tap "Add Student" below.</div>`;
}

function setupStudentSwitcher() {
  const btn = document.getElementById("student-switcher-btn");
  const list = document.getElementById("student-dropdown-list");

  btn.addEventListener("click", () => {
    renderStudentDropdown();
    list.hidden = !list.hidden;
  });

  list.addEventListener("click", (e) => {
    const item = e.target.closest(".student-dropdown-item");
    if (!item || !item.dataset.id) return;
    currentStudentId = item.dataset.id;
    list.hidden = true;
    renderStudentSwitcher();
    renderAll();
  });

  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !list.contains(e.target)) {
      list.hidden = true;
    }
  });
}

function setupAddStudentModal() {
  const modal = document.getElementById("add-student-modal");

  document.getElementById("nav-add-student").addEventListener("click", () => {
    document.getElementById("add-student-form").reset();
    modal.hidden = false;
  });

  document.getElementById("close-add-student").addEventListener("click", () => modal.hidden = true);
  modal.addEventListener("click", (e) => { if (e.target.id === "add-student-modal") modal.hidden = true; });

  document.getElementById("add-student-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("new-student-name").value.trim();
    const className = document.getElementById("new-student-class").value.trim();
    const gender = document.getElementById("new-student-gender").value;
    if (!name || !className || !currentUid) return;

    const docRef = await addDoc(collection(db, "families", currentUid, "students"), { name, className, gender });
    currentStudentId = docRef.id;
    modal.hidden = true;
  });
}

/* =========================================================
   4. SETTINGS (Auto vs Manual add) + Logout
   ========================================================= */
let autoAddEnabled = false;

function setupSettingsModal() {
  const modal = document.getElementById("settings-modal");
  const toggle = document.getElementById("auto-add-toggle");
  toggle.checked = autoAddEnabled;

  document.getElementById("open-settings").addEventListener("click", () => modal.hidden = false);
  document.getElementById("close-settings").addEventListener("click", () => modal.hidden = true);
  modal.addEventListener("click", (e) => { if (e.target.id === "settings-modal") modal.hidden = true; });
  toggle.addEventListener("change", () => { autoAddEnabled = toggle.checked; });
  document.getElementById("settings-ok-btn").addEventListener("click", () => modal.hidden = true);
}

/* =========================================================
   5. SUBJECT SHORT-NAME LIST (local per device)
   ========================================================= */
let subjectList = [
  "Maths", "EVS", "English", "Hindi", "Science", "SST",
  "Computer", "Sanskrit", "Art", "PE", "Music", "GK",
  "Moral Science", "Other"
];

function populateSubjectDropdown() {
  const select = document.getElementById("subject-select");
  select.innerHTML =
    subjectList.map(s => `<option value="${s}">${s}</option>`).join("") +
    `<option value="__add_new__">+ Add New Subject</option>`;
}

function setupSubjectDropdown() {
  const select = document.getElementById("subject-select");
  select.addEventListener("change", () => {
    if (select.value === "__add_new__") {
      const newSubject = prompt("Enter new subject short name (e.g. GK):");
      if (newSubject && newSubject.trim() !== "") {
        const trimmed = newSubject.trim();
        if (!subjectList.includes(trimmed)) subjectList.push(trimmed);
        populateSubjectDropdown();
        select.value = trimmed;
      } else {
        select.value = subjectList[0];
      }
    }
  });
}

/* =========================================================
   6. ADD / EDIT / REVIEW TASK MODAL
   ========================================================= */
let editingTaskId = null;

function todayISO() {
  return addDaysLocalISO(0);
}

// Returns a YYYY-MM-DD string for "N days from today," calculated using
// the device's LOCAL date/time (avoids timezone rollover bugs that
// toISOString() can cause, since that converts to UTC first).
function addDaysLocalISO(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function openAddModal() {
  if (!currentStudentId) {
    alert("Please add a student first (tap 'Add Student' below).");
    return;
  }
  editingTaskId = null;
  document.getElementById("add-task-form").reset();
  document.getElementById("given-date").value = todayISO();
  document.getElementById("modal-title").textContent = "Add Task";
  document.getElementById("submit-task-btn").textContent = "Add Task";
  document.getElementById("add-task-modal").hidden = false;
}

function openEditModal(taskId) {
  const t = tasks.find(task => task.id === taskId);
  if (!t) return;

  editingTaskId = taskId;
  document.getElementById("subject-select").value = t.subject;
  document.getElementById("task-text").value = t.task;
  document.getElementById("given-date").value = t.givenDate;
  document.getElementById("due-date").value = t.dueDate;
  document.getElementById("who-select").value = t.who;
  document.getElementById("task-type").value = t.taskType;
  document.getElementById("priority-select").value = t.priority;

  document.getElementById("modal-title").textContent = "Edit Task";
  document.getElementById("submit-task-btn").textContent = "Save Changes";
  document.getElementById("add-task-modal").hidden = false;
}

function openReviewModal(parsedTask) {
  editingTaskId = null;
  document.getElementById("subject-select").value = parsedTask.subject;
  document.getElementById("task-text").value = parsedTask.task;
  document.getElementById("given-date").value = parsedTask.givenDate;
  document.getElementById("due-date").value = parsedTask.dueDate;
  document.getElementById("who-select").value = parsedTask.who;
  document.getElementById("task-type").value = parsedTask.taskType;
  document.getElementById("priority-select").value = parsedTask.priority;

  document.getElementById("modal-title").textContent = "Review Parsed Task";
  document.getElementById("submit-task-btn").textContent = "Confirm & Add Task";
  document.getElementById("add-task-modal").hidden = false;
}

function closeModal() {
  document.getElementById("add-task-modal").hidden = true;
  editingTaskId = null;
}

function setupAddTaskModal() {
  document.getElementById("open-add-task").addEventListener("click", openAddModal);
  document.getElementById("close-add-task").addEventListener("click", closeModal);
  document.getElementById("add-task-modal").addEventListener("click", (e) => {
    if (e.target.id === "add-task-modal") closeModal();
  });
}

function setupAddTaskForm() {
  const form = document.getElementById("add-task-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUid || !currentStudentId) return;

    const subject = document.getElementById("subject-select").value;
    const taskText = document.getElementById("task-text").value;
    const givenDate = document.getElementById("given-date").value;
    const dueDate = document.getElementById("due-date").value;
    const who = document.getElementById("who-select").value;
    const taskType = document.getElementById("task-type").value;
    const priority = document.getElementById("priority-select").value;

    if (editingTaskId !== null) {
      await updateDoc(doc(db, "families", currentUid, "tasks", editingTaskId), {
        subject, task: taskText, givenDate, dueDate, who, taskType, priority
      });
    } else {
      await addDoc(collection(db, "families", currentUid, "tasks"), {
        studentId: currentStudentId,
        subject, task: taskText, givenDate, dueDate, who, taskType, priority,
        completed: false
      });
    }

    populateSubjectDropdown();
    closeModal();
  });
}

/* =========================================================
   7. PASTE WHATSAPP MESSAGE + PARSING
   ========================================================= */
function setupPasteMessageModal() {
  const modal = document.getElementById("paste-message-modal");
  const openTriggers = [document.getElementById("open-paste-message"), document.getElementById("nav-whatsapp")];

  openTriggers.forEach(btn => btn.addEventListener("click", () => {
    if (!currentStudentId) {
      alert("Please add a student first (tap 'Add Student' below).");
      return;
    }
    document.getElementById("paste-message-text").value = "";
    modal.hidden = false;
  }));

  document.getElementById("close-paste-message").addEventListener("click", () => modal.hidden = true);
  modal.addEventListener("click", (e) => { if (e.target.id === "paste-message-modal") modal.hidden = true; });

  document.getElementById("parse-message-btn").addEventListener("click", async () => {
    const rawText = document.getElementById("paste-message-text").value.trim();
    if (!rawText) {
      alert("Please paste a message first.");
      return;
    }

    const parsedTask = parseMessageToTask(rawText);
    modal.hidden = true;

    if (autoAddEnabled) {
      await addDoc(collection(db, "families", currentUid, "tasks"), {
        studentId: currentStudentId,
        subject: parsedTask.subject,
        task: parsedTask.task,
        givenDate: parsedTask.givenDate,
        dueDate: parsedTask.dueDate,
        who: parsedTask.who,
        taskType: parsedTask.taskType,
        priority: parsedTask.priority,
        completed: false
      });
      alert("Task added automatically. You can edit it anytime using the ✏️ icon.");
    } else {
      openReviewModal(parsedTask);
    }
  });
}

function parseMessageToTask(text) {
  const lowerText = text.toLowerCase();

  let foundSubject = "Other";
  for (const subj of subjectList) {
    if (subj !== "Other" && lowerText.includes(subj.toLowerCase())) {
      foundSubject = subj;
      break;
    }
  }

  let foundTaskType = "Other";
  if (/\bexam\b|\btest\b/.test(lowerText)) foundTaskType = "Exam / Test";
  else if (/\bproject\b/.test(lowerText)) foundTaskType = "Project";
  else if (/\bbring\b/.test(lowerText)) foundTaskType = "Bring something";
  else if (/\brevis(e|ion)\b/.test(lowerText)) foundTaskType = "Revision";
  else if (/\bhomework\b|\bhw\b/.test(lowerText)) foundTaskType = "Homework";

  let foundPriority = "Normal";
  if (/\burgent\b|\bimmediately\b|\basap\b/.test(lowerText)) foundPriority = "Urgent";

  let foundWho = "Student";
  if (/\bparents?\b/.test(lowerText)) foundWho = "Parent";

   let foundDueDate = "";

  // First, check for relative-day keywords (checked in this order so
  // "day after tomorrow" is matched before the shorter "tomorrow")
  if (/\bday after tomorrow\b/.test(lowerText)) {
    foundDueDate = addDaysLocalISO(2);
  } else if (/\btomorrow\b/.test(lowerText)) {
    foundDueDate = addDaysLocalISO(1);
  } else if (/\btoday\b/.test(lowerText)) {
    foundDueDate = addDaysLocalISO(0);
  } else {
    // Otherwise, look for a numeric date like 25/09 or 25-09-2026
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, "0");
      const month = dateMatch[2].padStart(2, "0");
      let year = dateMatch[3] ? dateMatch[3] : new Date().getFullYear().toString();
      if (year.length === 2) year = "20" + year;
      foundDueDate = `${year}-${month}-${day}`;
    }
  }

  // Final fallback if nothing was recognized at all
  if (!foundDueDate) {
    foundDueDate = addDaysLocalISO(3);
  }

  let foundTaskText = text.trim();
  if (foundTaskText.length > 200) foundTaskText = foundTaskText.slice(0, 200) + "...";

  return {
    subject: foundSubject,
    task: foundTaskText,
    givenDate: todayISO(),
    dueDate: foundDueDate,
    who: foundWho,
    taskType: foundTaskType,
    priority: foundPriority
  };
}

/* =========================================================
   8. HELPERS: dates
   ========================================================= */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function daysLeft(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function isToday(dateStr) {
  const today = new Date();
  const d = new Date(dateStr);
  return d.getFullYear() === today.getFullYear() &&
         d.getMonth() === today.getMonth() &&
         d.getDate() === today.getDate();
}

/* =========================================================
   9. AUTO PRIORITY UPGRADE RULE (display-only, not saved)
   ========================================================= */
function applyPriorityRules(taskList) {
  taskList.forEach(t => {
    if (t.completed) return;
    const left = daysLeft(t.dueDate);
    if (t.priority !== "Urgent" && left <= 2) t.priority = "Urgent";
  });
  return taskList;
}

/* =========================================================
   10. PRIORITY / ROW META
   ========================================================= */
function priorityBallClass(t) {
  if (t.completed) return "ball-completed";
  if (t.priority === "Urgent") return "ball-red";
  if (t.priority === "Normal") return "ball-orange";
  return "ball-blue";
}

function priorityRowClass(t) {
  if (t.completed) return "row-completed";
  if (t.priority === "Urgent") return "row-urgent";
  if (t.priority === "Normal") return "row-normal";
  return "row-low";
}

function daysBadgeClass(t) {
  if (t.completed) return "days-badge-completed";
  if (t.priority === "Urgent") return "days-badge-urgent";
  if (t.priority === "Normal") return "days-badge-normal";
  return "days-badge-low";
}

function buildDaysLabel(t) {
  const left = daysLeft(t.dueDate);
  if (t.completed) return "✓ Done";
  if (left < 0) return `${Math.abs(left)} day${Math.abs(left) === 1 ? "" : "s"} overdue`;
  if (left === 0) return "Due Today";
  return `${left} day${left === 1 ? "" : "s"} left`;
}

/* =========================================================
   11. BUILD ONE TASK ROW
   ========================================================= */
function buildTaskRow(t) {
  const daysLabel = buildDaysLabel(t);

  return `
    <div class="task-row ${priorityRowClass(t)}">

      <div class="row-line row-top">
        <span class="priority-ball ${priorityBallClass(t)}"></span>
        <span class="subject-name">${t.subject}</span>
      </div>

      <div class="row-line task-text">${t.task}</div>

      <div class="row-line dates-line">
        <span class="dates-text">Given: ${formatDate(t.givenDate)} &nbsp;|&nbsp; Due: ${formatDate(t.dueDate)}</span>
        <span class="days-badge ${daysBadgeClass(t)}">${daysLabel}</span>
      </div>

      <div class="row-line meta-line">${t.who} • ${t.taskType}</div>

      <div class="row-line actions-line">
        <label class="done-check-wrap">
          <input type="checkbox" class="done-checkbox" data-id="${t.id}" ${t.completed ? "checked" : ""} />
          <span>Mark Done</span>
        </label>
        <span class="action-icon" data-action="edit" data-id="${t.id}" title="Edit">✏️</span>
        <span class="action-icon" data-action="delete" data-id="${t.id}" title="Delete">🗑️</span>
      </div>

    </div>
  `;
}

/* =========================================================
   12. TABLE ACTIONS
   ========================================================= */
function attachRowActionListeners(containerId) {
  const container = document.getElementById(containerId);

  container.addEventListener("click", async (e) => {
    const icon = e.target.closest(".action-icon");
    if (!icon) return;

    const id = icon.dataset.id;
    const action = icon.dataset.action;

    if (action === "edit") openEditModal(id);

    if (action === "delete") {
      if (confirm("Delete this task? This cannot be undone.")) {
        await deleteDoc(doc(db, "families", currentUid, "tasks", id));
      }
    }
  });

  container.addEventListener("change", async (e) => {
    if (e.target.classList.contains("done-checkbox")) {
      const id = e.target.dataset.id;
      await updateDoc(doc(db, "families", currentUid, "tasks", id), {
        completed: e.target.checked
      });
    }
  });
}

function setupTaskTableActions() {
  attachRowActionListeners("task-table-body");
  attachRowActionListeners("completed-table-body");
}

/* =========================================================
   13. COMPLETED SECTION TOGGLE
   ========================================================= */
function setupCompletedToggle() {
  const toggleBtn = document.getElementById("completed-toggle");
  const listContainer = document.getElementById("completed-table-body");
  const arrow = document.getElementById("completed-arrow");

  toggleBtn.addEventListener("click", () => {
    listContainer.hidden = !listContainer.hidden;
    arrow.textContent = listContainer.hidden ? "▼" : "▲";
  });
}

/* =========================================================
   14. SORT + FILTER
   ========================================================= */
function getSortedPending(taskList) {
  return taskList.filter(t => !t.completed)
    .sort((a, b) => daysLeft(a.dueDate) - daysLeft(b.dueDate));
}

function getSortedCompleted(taskList) {
  return taskList.filter(t => t.completed)
    .sort((a, b) => daysLeft(a.dueDate) - daysLeft(b.dueDate));
}

let currentFilter = "all";

function getFilteredTasks() {
  const studentTasks = getStudentTasks();
  if (currentFilter === "urgent") return studentTasks.filter(t => !t.completed && t.priority === "Urgent");
  if (currentFilter === "today") return studentTasks.filter(t => !t.completed && isToday(t.dueDate));
  if (currentFilter === "parent") return studentTasks.filter(t => t.who === "Parent" || t.who === "Parent + Student");
  if (currentFilter === "student") return studentTasks.filter(t => t.who === "Student" || t.who === "Parent + Student");
  return studentTasks;
}

function setupFilterButtons() {
  const buttonMap = {
    "filter-all": "all",
    "filter-urgent": "urgent",
    "filter-today": "today",
    "filter-parent": "parent",
    "filter-student": "student"
  };

  Object.keys(buttonMap).forEach(btnId => {
    const btn = document.getElementById(btnId);
    btn.addEventListener("click", () => {
      currentFilter = buttonMap[btnId];
      document.querySelectorAll("#filter-bar .filter-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderPendingTasks();
    });
  });
}

/* =========================================================
   15. RENDER
   ========================================================= */
function renderPendingTasks() {
  applyPriorityRules(tasks);
  const filtered = getFilteredTasks();
  const pending = getSortedPending(filtered);
  const body = document.getElementById("task-table-body");

  if (!students.length) {
    body.innerHTML = `<p class="empty-message">No students yet. Tap "Add Student" below to get started.</p>`;
    return;
  }

  body.innerHTML = pending.length
    ? pending.map(buildTaskRow).join("")
    : `<p class="empty-message">No pending tasks. Nice work!</p>`;
}

function renderCompletedTasks() {
  const studentTasks = getStudentTasks();
  const completed = getSortedCompleted(studentTasks);
  const body = document.getElementById("completed-table-body");
  body.innerHTML = completed.length
    ? completed.map(buildTaskRow).join("")
    : `<p class="empty-message">No completed tasks yet.</p>`;

  document.getElementById("completed-count-toggle").textContent = completed.length;
}

function renderStatCards() {
  const studentTasks = getStudentTasks();
  const overdue = studentTasks.filter(t => !t.completed && daysLeft(t.dueDate) < 0).length;
  const dueToday = studentTasks.filter(t => !t.completed && daysLeft(t.dueDate) === 0).length;
  const thisWeek = studentTasks.filter(t => !t.completed && daysLeft(t.dueDate) >= 0 && daysLeft(t.dueDate) <= 7).length;
  const completedCount = studentTasks.filter(t => t.completed).length;

  document.getElementById("stat-overdue").textContent = overdue;
  document.getElementById("stat-due-today").textContent = dueToday;
  document.getElementById("stat-this-week").textContent = thisWeek;
  document.getElementById("stat-completed").textContent = completedCount;
}

function renderAll() {
  renderStatCards();
  renderPendingTasks();
  renderCompletedTasks();
}

/* =========================================================
   16. BOTTOM NAV
   ========================================================= */
function setupBottomNav() {
  document.querySelectorAll(".nav-btn[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      document.querySelectorAll(".nav-btn[data-view]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.getElementById("home-view-wrapper").hidden = view !== "home";
      document.getElementById("about-view").hidden = view !== "about";
    });
  });
}

/* =========================================================
   17. RUN ON PAGE LOAD
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  setupLoginScreen();
  setupLogout();
  setupStudentSwitcher();
  setupAddStudentModal();
  populateSubjectDropdown();
  setupSubjectDropdown();
  setupSettingsModal();
  setupAddTaskModal();
  setupAddTaskForm();
  setupPasteMessageModal();
  setupTaskTableActions();
  setupCompletedToggle();
  setupFilterButtons();
  setupBottomNav();
  document.getElementById("filter-all").classList.add("active");
});
