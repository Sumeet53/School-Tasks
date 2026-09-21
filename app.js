/* =========================================================
   1. STUDENTS
   ========================================================= */
let students = [
  { id: 1, name: "Soham", className: "Class 8", gender: "Boy" }
];
let currentStudentId = 1;

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
    student ? `${student.name} — ${student.className}` : "No student";
}

function renderStudentDropdown() {
  const list = document.getElementById("student-dropdown-list");
  list.innerHTML = students.map(s => `
    <div class="student-dropdown-item ${s.id === currentStudentId ? "active" : ""}" data-id="${s.id}">
      ${genderAvatar(s.gender)} ${s.name} — ${s.className}
    </div>
  `).join("");
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
    if (!item) return;
    currentStudentId = Number(item.dataset.id);
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

  document.getElementById("close-add-student").addEventListener("click", () => {
    modal.hidden = true;
  });

  modal.addEventListener("click", (e) => {
    if (e.target.id === "add-student-modal") modal.hidden = true;
  });

    document.getElementById("add-student-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("new-student-name").value.trim();
    const className = document.getElementById("new-student-class").value.trim();
    const gender = document.getElementById("new-student-gender").value;
    if (!name || !className) return;

    const newStudent = { id: Date.now(), name, className, gender };
    students.push(newStudent);
    currentStudentId = newStudent.id;

    renderStudentSwitcher();
    renderAll();
    modal.hidden = true;
  });
}

/* =========================================================
   2. SAMPLE TASK DATA (each task belongs to a studentId)
   ========================================================= */
let tasks = [
  { id: 1, studentId: 1, subject: "Maths", task: "Ex 6.3 Q1-10", givenDate: "2026-09-10", dueDate: "2026-09-14", who: "Student", taskType: "Homework", priority: "Urgent", completed: false },
  { id: 2, studentId: 1, subject: "Science", task: "Bring activity file", givenDate: "2026-09-10", dueDate: "2026-09-14", who: "Parent", taskType: "Bring something", priority: "Urgent", completed: false },
  { id: 3, studentId: 1, subject: "English", task: "Complete worksheets", givenDate: "2026-09-11", dueDate: "2026-09-15", who: "Student", taskType: "Homework", priority: "Urgent", completed: false },
  { id: 4, studentId: 1, subject: "Hindi", task: "Read chapter 5 and answer questions", givenDate: "2026-09-12", dueDate: "2026-09-16", who: "Student", taskType: "Homework", priority: "Normal", completed: false },
  { id: 5, studentId: 1, subject: "EVS", task: "Project file (keep ready)", givenDate: "2026-09-13", dueDate: "2026-09-18", who: "Parent", taskType: "Project", priority: "Low", completed: false },
  { id: 6, studentId: 1, subject: "Maths", task: "Revise formulas", givenDate: "2026-09-05", dueDate: "2026-09-10", who: "Student", taskType: "Revision", priority: "Normal", completed: true },
  { id: 7, studentId: 1, subject: "Science", task: "Read chapter 3", givenDate: "2026-09-08", dueDate: "2026-09-12", who: "Student", taskType: "Homework", priority: "Normal", completed: true }
];

/* =========================================================
   3. SETTINGS (Auto vs Manual add)
   ========================================================= */
let autoAddEnabled = false;

function setupSettingsModal() {
  const modal = document.getElementById("settings-modal");
  const toggle = document.getElementById("auto-add-toggle");
  toggle.checked = autoAddEnabled;

  document.getElementById("open-settings").addEventListener("click", () => modal.hidden = false);
  document.getElementById("nav-settings").addEventListener("click", () => modal.hidden = false);
  document.getElementById("close-settings").addEventListener("click", () => modal.hidden = true);
  modal.addEventListener("click", (e) => { if (e.target.id === "settings-modal") modal.hidden = true; });
  toggle.addEventListener("change", () => { autoAddEnabled = toggle.checked; });
  document.getElementById("settings-ok-btn").addEventListener("click", () => modal.hidden = true);
}

/* =========================================================
   4. SUBJECT SHORT-NAME LIST
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
   5. ADD / EDIT / REVIEW TASK MODAL
   ========================================================= */
let editingTaskId = null;

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function openAddModal() {
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
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const subject = document.getElementById("subject-select").value;
    const taskText = document.getElementById("task-text").value;
    const givenDate = document.getElementById("given-date").value;
    const dueDate = document.getElementById("due-date").value;
    const who = document.getElementById("who-select").value;
    const taskType = document.getElementById("task-type").value;
    const priority = document.getElementById("priority-select").value;

    if (editingTaskId !== null) {
      const t = tasks.find(task => task.id === editingTaskId);
      if (t) {
        t.subject = subject;
        t.task = taskText;
        t.givenDate = givenDate;
        t.dueDate = dueDate;
        t.who = who;
        t.taskType = taskType;
        t.priority = priority;
      }
    } else {
      tasks.push({
        id: Date.now(),
        studentId: currentStudentId,
        subject, task: taskText, givenDate, dueDate, who, taskType, priority,
        completed: false
      });
    }

    renderAll();
    populateSubjectDropdown();
    closeModal();
  });
}

/* =========================================================
   6. PASTE WHATSAPP MESSAGE + PARSING
   ========================================================= */
function setupPasteMessageModal() {
  const modal = document.getElementById("paste-message-modal");
  const openTriggers = [document.getElementById("open-paste-message"), document.getElementById("nav-whatsapp")];

  openTriggers.forEach(btn => btn.addEventListener("click", () => {
    document.getElementById("paste-message-text").value = "";
    modal.hidden = false;
  }));

  document.getElementById("close-paste-message").addEventListener("click", () => modal.hidden = true);
  modal.addEventListener("click", (e) => { if (e.target.id === "paste-message-modal") modal.hidden = true; });

  document.getElementById("parse-message-btn").addEventListener("click", () => {
    const rawText = document.getElementById("paste-message-text").value.trim();
    if (!rawText) {
      alert("Please paste a message first.");
      return;
    }

    const parsedTask = parseMessageToTask(rawText);
    modal.hidden = true;

    if (autoAddEnabled) {
      tasks.push({
        id: Date.now(),
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
      renderAll();
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
  const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    let year = dateMatch[3] ? dateMatch[3] : new Date().getFullYear().toString();
    if (year.length === 2) year = "20" + year;
    foundDueDate = `${year}-${month}-${day}`;
  }
  if (!foundDueDate) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 3);
    foundDueDate = fallback.toISOString().split("T")[0];
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
   7. HELPERS: dates
   ========================================================= */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function dayName(dateStr) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(dateStr).getDay()];
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
   8. AUTO PRIORITY UPGRADE RULE (skips completed tasks)
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
   9. PRIORITY / ROW META
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

/* =========================================================
   10. BUILD ONE TASK ROW (4-column layout)
   ========================================================= */
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
   11. TABLE ACTIONS (checkbox / edit / delete)
   ========================================================= */
function attachRowActionListeners(containerId) {
  const container = document.getElementById(containerId);

  container.addEventListener("click", (e) => {
    const icon = e.target.closest(".action-icon");
    if (!icon) return;

    const id = Number(icon.dataset.id);
    const action = icon.dataset.action;

    if (action === "edit") openEditModal(id);

    if (action === "delete") {
      if (confirm("Delete this task? This cannot be undone.")) {
        tasks = tasks.filter(t => t.id !== id);
        renderAll();
      }
    }
  });

  container.addEventListener("change", (e) => {
    if (e.target.classList.contains("done-checkbox")) {
      const id = Number(e.target.dataset.id);
      const t = tasks.find(task => task.id === id);
      if (t) {
        t.completed = e.target.checked;
        renderAll();
      }
    }
  });
}

function setupTaskTableActions() {
  attachRowActionListeners("task-table-body");
  attachRowActionListeners("completed-table-body");
}

/* =========================================================
   COMPLETED SECTION TOGGLE
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
   12. SORT: expired first, then soonest due date (automatic)
   ========================================================= */
function getSortedPending(taskList) {
  return taskList.filter(t => !t.completed)
    .sort((a, b) => daysLeft(a.dueDate) - daysLeft(b.dueDate));
}

function getSortedCompleted(taskList) {
  return taskList.filter(t => t.completed)
    .sort((a, b) => daysLeft(a.dueDate) - daysLeft(b.dueDate));
}

/* =========================================================
   13. FILTERS
   ========================================================= */
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
   14. RENDER
   ========================================================= */
function renderPendingTasks() {
  applyPriorityRules(tasks);
  const filtered = getFilteredTasks();
  const pending = getSortedPending(filtered);
  const body = document.getElementById("task-table-body");
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
   15. BOTTOM NAV (Home / About view switching)
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
   16. RUN ON PAGE LOAD
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderStudentSwitcher();
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
  renderAll();
});
