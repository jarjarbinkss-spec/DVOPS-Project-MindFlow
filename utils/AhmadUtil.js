// MindFlow backend for: (Read) view / filter workload tasks
const fs = require('fs').promises;
const path = require('path');

const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Must match the values used by the Create Task and Update Status features
const VALID_EFFORTS = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Pending', 'In Progress', 'Completed'];
const VALID_SORT_FIELDS = ['deadline', 'effort', 'name', 'status'];
const VALID_ORDERS = ['asc', 'desc'];
const EFFORT_RANK = { Low: 1, Medium: 2, High: 3 };

async function readJSON(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

// ---------- READ: view / filter workload tasks ----------
// GET /view-tasks?module=&effort=&status=&dueBefore=&sortBy=&order=
async function viewTasks(req, res) {
  try {
    const { module: moduleName, effort, status, dueBefore, sortBy, order } = req.query;

    // Error case 1: invalid filter or sort value -> 400
    const errors = [];
    if (effort && !VALID_EFFORTS.includes(effort)) {
      errors.push(`effort must be one of: ${VALID_EFFORTS.join(', ')}`);
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    if (dueBefore && !isValidDate(dueBefore)) {
      errors.push('dueBefore must be a valid date in YYYY-MM-DD format');
    }
    if (sortBy && !VALID_SORT_FIELDS.includes(sortBy)) {
      errors.push(`sortBy must be one of: ${VALID_SORT_FIELDS.join(', ')}`);
    }
    if (order && !VALID_ORDERS.includes(order)) {
      errors.push(`order must be one of: ${VALID_ORDERS.join(', ')}`);
    }
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Invalid filter criteria', errors });
    }

    let tasks = await readJSON(TASKS_FILE);

    if (moduleName) {
      tasks = tasks.filter((t) => t.module.toLowerCase() === moduleName.trim().toLowerCase());
    }
    if (effort) tasks = tasks.filter((t) => t.effort === effort);
    if (status) tasks = tasks.filter((t) => t.status === status);
    if (dueBefore) tasks = tasks.filter((t) => t.deadline <= dueBefore);

    // Error case 2: nothing matches -> 404
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks match the selected filters' });
    }

    const field = sortBy || 'deadline';
    const direction = order === 'desc' ? -1 : 1;
    tasks.sort((a, b) => {
      let x = a[field];
      let y = b[field];
      if (field === 'effort') {
        x = EFFORT_RANK[x];
        y = EFFORT_RANK[y];
      }
      if (x < y) return -1 * direction;
      if (x > y) return 1 * direction;
      return 0;
    });

    // Success case
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to read tasks from the data store' });
  }
}

module.exports = { readJSON, writeJSON, viewTasks, TASKS_FILE };
