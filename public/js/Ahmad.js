// MindFlow frontend for: (Read) view / filter workload tasks
const messageBox = document.getElementById('message');
const taskBody = document.getElementById('task-body');
const summary = document.getElementById('summary');
const filterForm = document.getElementById('filter-form');

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
}

function clearMessage() {
  messageBox.className = 'message hidden';
  messageBox.textContent = '';
}

function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// Frontend validation (the backend validates again)
function validateFilters(filters) {
  if (filters.dueBefore && !isValidDate(filters.dueBefore)) {
    return 'Enter the due date as a valid date (YYYY-MM-DD).';
  }
  if (filters.module.length > 40) {
    return 'Module must be 40 characters or fewer.';
  }
  return null;
}

function getFilters() {
  return {
    module: document.getElementById('filter-module').value.trim(),
    effort: document.getElementById('filter-effort').value,
    status: document.getElementById('filter-status').value,
    dueBefore: document.getElementById('filter-due').value,
    sortBy: document.getElementById('sort-by').value,
    order: document.getElementById('sort-order').value,
  };
}

// ---------- READ: view / filter workload tasks ----------
async function loadTasks() {
  const filters = getFilters();
  const problem = validateFilters(filters);
  if (problem) {
    showMessage(problem, 'error');
    return;
  }

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  try {
    const response = await fetch(`/view-tasks?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      taskBody.replaceChildren();
      summary.textContent = '';
      const detail = data.errors ? ` ${data.errors.join('; ')}` : '';
      showMessage(`${data.message}.${detail}`, response.status === 404 ? 'info' : 'error');
      return;
    }

    clearMessage();
    renderTasks(data);
  } catch (error) {
    showMessage('Could not reach the server. Please try again.', 'error');
  }
}

function makeCell(text, className) {
  const td = document.createElement('td');
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

function makeBadgeCell(text, extraClass) {
  const td = document.createElement('td');
  const span = document.createElement('span');
  span.className = `badge ${extraClass || ''}`.trim();
  span.textContent = text;
  td.appendChild(span);
  return td;
}

function renderTasks(tasks) {
  const today = todayString();
  const overdueCount = tasks.filter((t) => t.deadline < today && t.status !== 'Completed').length;
  summary.textContent = `Showing ${tasks.length} task${tasks.length === 1 ? '' : 's'}` +
    (overdueCount > 0 ? ` (${overdueCount} overdue)` : '');

  taskBody.replaceChildren();
  tasks.forEach((task) => {
    const isOverdue = task.deadline < today && task.status !== 'Completed';
    const row = document.createElement('tr');
    row.appendChild(makeCell(task.name));
    row.appendChild(makeCell(task.module));
    row.appendChild(makeBadgeCell(task.effort, task.effort.toLowerCase()));
    row.appendChild(makeBadgeCell(task.status));
    row.appendChild(makeCell(isOverdue ? `${task.deadline} (overdue)` : task.deadline, isOverdue ? 'overdue' : ''));

    const actionCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete task ${task.name}`);
    deleteButton.addEventListener('click', () => deleteTask(task.id, task.name));
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);

    taskBody.appendChild(row);
  });
}

loadTasks();