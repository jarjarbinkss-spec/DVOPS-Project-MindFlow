const fs = require('fs').promises;
const path = require('path');

// The template is used as a fallback if the main file hasn't been created yet.
const DATA_FILE = path.join(__dirname, 'sessions.json');
const TEMPLATE_FILE = path.join(__dirname, 'sessions.template.json');

// ---------- helpers ----------

// Reads the whole shared data object, e.g. { "focus_sessions": [ ... ], ... }
async function readData() {
  for (const file of [DATA_FILE, TEMPLATE_FILE]) {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const data = JSON.parse(raw);
      if (!Array.isArray(data.focus_sessions)) data.focus_sessions = [];
      return data;
    } catch (err) {
      if (err.code === 'ENOENT') continue; // try next file
      throw err;
    }
  }
  // Neither file exists yet: behave as an empty data store
  return { focus_sessions: [] };
}

// Writes the WHOLE data object back so other teammates' data is preserved
async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// "HH:MM" (24h) -> minutes since midnight, or null if invalid
function toMinutes(time) {
  if (typeof time !== 'string') return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

// Rejects bad formats AND rolled-over dates like 2026-02-30 or 2026-04-31
function isValidDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return false;
  return parsedDate.toISOString().startsWith(date);
}

// Two ranges overlap if each starts before the other ends
function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

// ---------- main feature ----------
/**
 * Update an existing focus session.
 * Returns { status, body } so the route can respond directly.
 *
 * Success (200): session updated
 * Error 400: missing/invalid/non-string field, invalid date, or end not after start
 * Error 404: session not found (including when the data file doesn't exist yet)
 * Error 409: new time slot overlaps another session for the same user
 */
async function updateFocusSession(sessionId, updates) {
  try {
    const { subject, date, startTime, endTime, notes } = updates || {};

    // 1. Validate required fields (type check comes BEFORE .trim())
    if (!sessionId) {
      return { status: 400, body: { success: false, message: 'Session ID is required.' } };
    }
    if (
      typeof subject !== 'string' || !subject.trim() ||
      typeof date !== 'string' || !date ||
      typeof startTime !== 'string' || !startTime ||
      typeof endTime !== 'string' || !endTime
    ) {
      return {
        status: 400,
        body: { success: false, message: 'Subject, date, start time and end time are required and must be text.' }
      };
    }
    if (notes !== undefined && typeof notes !== 'string') {
      return { status: 400, body: { success: false, message: 'Notes must be text.' } };
    }
    if (!isValidDate(date)) {
      return {
        status: 400,
        body: { success: false, message: 'Date must be a real calendar date in YYYY-MM-DD format.' }
      };
    }

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    if (start === null || end === null) {
      return { status: 400, body: { success: false, message: 'Times must be in HH:MM (24-hour) format.' } };
    }

    // 2. Error scenario: end must be after start
    if (end <= start) {
      return {
        status: 400,
        body: { success: false, message: 'End time must be later than start time.' }
      };
    }

    // 3. Find the existing session
    const data = await readData();
    const sessions = data.focus_sessions;
    const index = sessions.findIndex(s => String(s.id) === String(sessionId));
    if (index === -1) {
      return { status: 404, body: { success: false, message: 'Focus session not found.' } };
    }
    const existing = sessions[index];

    // 4. Error scenario: overlap with another session of the same user (exclude itself)
    const conflict = sessions.find(s =>
      String(s.id) !== String(sessionId) &&
      s.userId === existing.userId &&
      s.date === date &&
      overlaps(start, end, toMinutes(s.startTime), toMinutes(s.endTime))
    );
    if (conflict) {
      return {
        status: 409,
        body: {
          success: false,
          message: `This time slot overlaps with an existing session (${conflict.startTime} - ${conflict.endTime}).`
        }
      };
    }

    // 5. Success: apply update and save changes to JSON file
    sessions[index] = {
      ...existing,
      subject: subject.trim(),
      date,
      startTime,
      endTime,
      notes: notes !== undefined ? notes.trim() : existing.notes,
      updatedAt: new Date().toISOString()
    };
    await writeData(data);

    return {
      status: 200,
      body: { success: true, message: 'Focus session updated successfully.', session: sessions[index] }
    };
  } catch (err) {
    console.error('updateFocusSession error:', err);
    return { status: 500, body: { success: false, message: 'Internal server error.' } };
  }
}

module.exports = { updateFocusSession };