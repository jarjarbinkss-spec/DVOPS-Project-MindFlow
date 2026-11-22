// READ feature: view and filter logged focus sessions
const fs = require('fs').promises;
const path = require('path');

// __dirname makes the path work no matter which folder the server is started from
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SUBJECT_LENGTH = 50;
const VALID_SORT_FIELDS = ['date', 'startTime', 'subject', 'durationMinutes'];
const VALID_ORDERS = ['asc', 'desc'];

// Check that a "YYYY-MM-DD" string is a real calendar date (rejects 2026-02-31)
function isValidDate(dateString) {
    if (!DATE_REGEX.test(dateString)) return false;
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

// Read all sessions. A missing file means no sessions have been logged yet.
async function readSessions() {
    try {
        const data = await fs.readFile(SESSIONS_FILE, 'utf8');
        const sessions = JSON.parse(data);
        if (!Array.isArray(sessions)) {
            throw new Error('sessions.json must contain an array');
        }
        return sessions;
    } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw err;
    }
}

// Returns a list of error messages (empty list = filters are valid)
function validateFilters({ subject, date, minDuration, sortBy, order }) {
    const errors = [];
    const params = { subject, date, minDuration, sortBy, order };

    Object.keys(params).forEach(function (name) {
        if (params[name] !== undefined && typeof params[name] !== 'string') {
            errors.push(name + ' must be a single value.');
        }
    });
    if (errors.length > 0) return errors;

    if (subject !== undefined && subject.trim().length > MAX_SUBJECT_LENGTH) {
        errors.push('subject must be at most ' + MAX_SUBJECT_LENGTH + ' characters.');
    }
    if (date !== undefined && date !== '' && !isValidDate(date)) {
        errors.push('date must be a valid date in YYYY-MM-DD format.');
    }
    if (minDuration !== undefined && minDuration !== '' && !/^[1-9]\d*$/.test(minDuration)) {
        errors.push('minDuration must be a positive whole number of minutes.');
    }
    if (sortBy !== undefined && sortBy !== '' && !VALID_SORT_FIELDS.includes(sortBy)) {
        errors.push('sortBy must be one of: ' + VALID_SORT_FIELDS.join(', ') + '.');
    }
    if (order !== undefined && order !== '' && !VALID_ORDERS.includes(order)) {
        errors.push('order must be one of: ' + VALID_ORDERS.join(', ') + '.');
    }
    return errors;
}

// GET /view-sessions?subject=&date=&minDuration=&sortBy=&order=
async function viewSessions(req, res) {
    try {
        const { subject, date, minDuration, sortBy, order } = req.query;

        // 1. Validate the filters (Error Case 1: invalid filter values)
        const errors = validateFilters({ subject, date, minDuration, sortBy, order });
        if (errors.length > 0) {
            return res.status(400).json({ message: errors.join(' '), errors: errors });
        }

        // 2. Read the sessions from the JSON data store
        let sessions = await readSessions();

        // 3. Apply the filters
        const subjectFilter = subject ? subject.trim().toLowerCase() : '';
        const filtersUsed = Boolean(subjectFilter || date || minDuration);

        if (subjectFilter) {
            sessions = sessions.filter(function (s) {
                return s.subject.toLowerCase().includes(subjectFilter);
            });
        }
        if (date) {
            sessions = sessions.filter(function (s) {
                return s.date === date;
            });
        }
        if (minDuration) {
            sessions = sessions.filter(function (s) {
                return s.durationMinutes >= Number(minDuration);
            });
        }

        // 4. Nothing to show (Error Case 2)
        if (sessions.length === 0) {
            return res.status(404).json({
                message: filtersUsed
                    ? 'No focus sessions match the selected filters.'
                    : 'No focus sessions have been logged yet.'
            });
        }

        // 5. Sort (default: oldest first by date, then start time)
        const field = sortBy || 'date';
        const direction = order === 'desc' ? -1 : 1;
        sessions.sort(function (a, b) {
            let result;
            if (typeof a[field] === 'string') {
                result = a[field].localeCompare(b[field]);
            } else {
                result = a[field] - b[field];
            }
            if (result === 0) {
                result = a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
            }
            return result * direction;
        });

        // 6. Success Case
        const totalMinutes = sessions.reduce(function (sum, s) {
            return sum + s.durationMinutes;
        }, 0);

        return res.status(200).json({
            count: sessions.length,
            totalMinutes: totalMinutes,
            sessions: sessions
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to read focus sessions.' });
    }
}

module.exports = { viewSessions, validateFilters, readSessions };