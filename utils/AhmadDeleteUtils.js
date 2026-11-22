// DELETE feature: remove a logged focus session by id
const fs = require('fs').promises;
const path = require('path');

const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

// DELETE /delete-session/:id
async function deleteSession(req, res) {
    try {
        const idText = req.params.id;

        // 1. Validate the id (Error Case 1: not a positive whole number)
        if (!/^\d+$/.test(idText) || Number(idText) <= 0) {
            return res.status(400).json({ message: 'Session id must be a positive whole number.' });
        }
        const id = Number(idText);

        // 2. Read the sessions (a missing file means there is nothing to delete)
        let sessions = [];
        try {
            const data = await fs.readFile(SESSIONS_FILE, 'utf8');
            sessions = JSON.parse(data);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }

        // 3. Find the session (Error Case 2: already deleted or never existed)
        const index = sessions.findIndex(function (s) {
            return s.id === id;
        });
        if (index === -1) {
            return res.status(404).json({ message: 'Session ' + id + ' was not found.' });
        }

        // 4. Remove it and save (Success Case)
        const deleted = sessions.splice(index, 1)[0];
        await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');

        return res.status(200).json({
            message: 'Session "' + deleted.subject + '" on ' + deleted.date + ' deleted successfully.',
            session: deleted
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to delete the focus session.' });
    }
}

module.exports = { deleteSession };
