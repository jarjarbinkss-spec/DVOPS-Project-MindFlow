// MindFlow backend for: Delete delete a workload task
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

// ---------- DELETE: remove a workload task ----------
// DELETE /delete-task/:id
async function deleteTask(req, res) {
  try {
    const id = Number(req.params.id);

    // Error case 1: id is not a positive whole number -> 400
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Task id must be a positive whole number' });
    }

    const tasks = await readJSON(TASKS_FILE);
    const index = tasks.findIndex((t) => t.id === id);

    // Error case 2: task does not exist (already deleted / never created) -> 404
    if (index === -1) {
      return res.status(404).json({ message: `Task ${id} was not found` });
    }

    // Error case 3: business rule - a task being worked on cannot be deleted -> 409
    if (tasks[index].status === 'In Progress') {
      return res.status(409).json({
        message: 'A task that is In Progress cannot be deleted. Change its status first.',
      });
    }

    // Success case
    const [deleted] = tasks.splice(index, 1);
    await writeJSON(TASKS_FILE, tasks);
    return res.status(200).json({ message: `Task "${deleted.name}" deleted successfully`, task: deleted });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update the data store' });
  }
}

module.exports = { readJSON, writeJSON, deleteTask, TASKS_FILE };
