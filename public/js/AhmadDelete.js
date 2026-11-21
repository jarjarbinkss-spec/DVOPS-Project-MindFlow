// MindFlow frontend for: (Delete) delete a task

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

// ---------- DELETE: remove a workload task ----------
async function deleteTask(id, name) {
  if (!Number.isInteger(id) || id <= 0) {
    showMessage('This task has an invalid id and cannot be deleted.', 'error');
    return;
  }
  if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

  try {
    const response = await fetch(`/delete-task/${id}`, { method: 'DELETE' });
    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message, 'error');
      return;
    }

    await loadTasks();                     // refresh the list
    showMessage(data.message, 'success');  // show after reload so it is not cleared
  } catch (error) {
    showMessage('Could not reach the server. Please try again.', 'error');
  }
}

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadTasks();
});

document.getElementById('reset-filters').addEventListener('click', () => {
  filterForm.reset();
  loadTasks();
});

loadTasks();