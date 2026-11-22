const fs = require('fs').promises;
const path = require('path');

const SESSIONS_FILE = path.join('utils', 'sessions.json');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_SUBJECT_LENGTH = 50;

// Convert "HH:MM" to minutes since midnight (e.g. "09:30" -> 570)
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

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

// Returns an error message string if the input is invalid, otherwise null
function validateSessionInput({ subject, date, startTime, endTime }) {
    if (typeof subject !== 'string' || subject.trim() === '') {
        return 'Subject is required.';
    }
    if (subject.trim().length > MAX_SUBJECT_LENGTH) {
        return `Subject must be at most ${MAX_SUBJECT_LENGTH} characters.`;
    }
    if (typeof date !== 'string' || date.trim() === '') {
        return 'Date is required.';
    }
    if (!isValidDate(date)) {
        return 'Date must be a valid date in YYYY-MM-DD format.';
    }
    if (typeof startTime !== 'string' || startTime.trim() === '') {
        return 'Start time is required.';
    }
    if (typeof endTime !== 'string' || endTime.trim() === '') {
        return 'End time is required.';
    }
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
        return 'Start time and end time must be in HH:MM format.';
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        return 'End time must be later than start time (duration must be more than 0 minutes).';
    }
    return null;
}

// Two sessions overlap if they are on the same date and their time ranges intersect.
// Back-to-back sessions (one ends exactly when the next starts) are NOT overlaps.
function findOverlap(sessions, date, startTime, endTime) {
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    return sessions.find(function (existing) {
        if (existing.date !== date) return false;
        const existingStart = timeToMinutes(existing.startTime);
        const existingEnd = timeToMinutes(existing.endTime);
        return newStart < existingEnd && newEnd > existingStart;
    });
}

async function logSession(req, res) {
    try {
        const { subject, date, startTime, endTime } = req.body || {};

        // 1. Validate input (Error Case 2: missing / invalid data)
        const validationError = validateSessionInput({ subject, date, startTime, endTime });
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        // 2. Read the existing sessions from the JSON data store
        let sessions = [];
        try {
            const data = await fs.readFile(SESSIONS_FILE, 'utf8');
            sessions = JSON.parse(data);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
            // File does not exist yet: start with an empty list
        }

        // 3. Check for overlapping sessions (Error Case 1)
        const overlap = findOverlap(sessions, date, startTime, endTime);
        if (overlap) {
            return res.status(409).json({
                message: `Time slot overlaps with an existing session: ${overlap.subject} (${overlap.startTime} - ${overlap.endTime}) on ${overlap.date}.`
            });
        }

        // 4. Build and save the new session (Success Case)
        const maxId = sessions.reduce(function (max, s) {
            return s.id > max ? s.id : max;
        }, 0);

        const newSession = {
            id: maxId + 1,
            subject: subject.trim(),
            date: date,
            startTime: startTime,
            endTime: endTime,
            durationMinutes: timeToMinutes(endTime) - timeToMinutes(startTime)
        };

        sessions.push(newSession);
        await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');

        return res.status(201).json({
            message: 'Focus session logged successfully!',
            session: newSession
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = { logSession, validateSessionInput, findOverlap, timeToMinutes };
