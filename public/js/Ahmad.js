// READ feature (frontend): view and filter logged focus sessions

function showViewMessage(text, type) {
    var box = document.getElementById('viewMessage');
    box.textContent = text;
    box.className = 'message ' + type;
}

function clearViewMessage() {
    var box = document.getElementById('viewMessage');
    box.textContent = '';
    box.className = 'message hidden';
}

// Client-side validation. Returns an error message, or '' if the filters are fine.
function validateViewFilters(filters) {
    if (filters.subject.length > 50) {
        return 'Subject filter must be at most 50 characters.';
    }
    if (filters.minDuration !== '' && !/^[1-9]\d*$/.test(filters.minDuration)) {
        return 'Minimum duration must be a positive whole number of minutes.';
    }
    return '';
}

function makeViewCell(text) {
    var td = document.createElement('td');
    td.textContent = text;
    return td;
}

function renderSessions(data) {
    var body = document.getElementById('sessionsTableBody');
    body.replaceChildren();

    data.sessions.forEach(function (session) {
        var row = document.createElement('tr');
        row.setAttribute('data-id', session.id);
        row.setAttribute('data-subject', session.subject);

        row.appendChild(makeViewCell(session.subject));
        row.appendChild(makeViewCell(session.date));
        row.appendChild(makeViewCell(session.startTime + ' - ' + session.endTime));
        row.appendChild(makeViewCell(session.durationMinutes + ' min'));

        // Empty cell: the delete feature (delete-session.js) adds its button here
        var actionCell = document.createElement('td');
        actionCell.className = 'sessionActionCell';
        row.appendChild(actionCell);

        body.appendChild(row);
    });

    var hours = Math.floor(data.totalMinutes / 60);
    var minutes = data.totalMinutes % 60;
    document.getElementById('viewSummary').textContent =
        data.count + ' session' + (data.count === 1 ? '' : 's') +
        ', total focus time: ' + hours + 'h ' + minutes + 'm';

    document.dispatchEvent(new CustomEvent('sessionsRendered'));
}

function clearSessionsTable() {
    document.getElementById('sessionsTableBody').replaceChildren();
    document.getElementById('viewSummary').textContent = '';
}

// Ask the backend for the sessions that match the filters
function loadSessions() {
    var filters = {
        subject: document.getElementById('viewSubject').value.trim(),
        date: document.getElementById('viewDate').value,
        minDuration: document.getElementById('viewMinDuration').value.trim(),
        sortBy: document.getElementById('viewSortBy').value,
        order: document.getElementById('viewSortOrder').value
    };

    var validationError = validateViewFilters(filters);
    if (validationError !== '') {
        showViewMessage(validationError, 'error');
        return;
    }

    var params = [];
    Object.keys(filters).forEach(function (key) {
        if (filters[key] !== '') {
            params.push(encodeURIComponent(key) + '=' + encodeURIComponent(filters[key]));
        }
    });

    var request = new XMLHttpRequest();
    request.open('GET', '/view-sessions?' + params.join('&'), true);

    request.onload = function () {
        var response;
        try {
            response = JSON.parse(request.responseText);
        } catch (e) {
            showViewMessage('Unexpected response from the server.', 'error');
            return;
        }

        if (request.status === 200) {
            clearViewMessage();
            renderSessions(response);
        } else {
            // 400 (invalid filters), 404 (nothing found) or 500 (server error)
            clearSessionsTable();
            showViewMessage(response.message, request.status === 404 ? 'info' : 'error');
        }
    };

    request.onerror = function () {
        showViewMessage('Unable to reach the server.', 'error');
    };

    request.send();
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('viewFilterForm').addEventListener('submit', function (event) {
        event.preventDefault();
        loadSessions();
    });

    document.getElementById('viewResetBtn').addEventListener('click', function () {
        document.getElementById('viewFilterForm').reset();
        loadSessions();
    });

    // Reload the list whenever the delete feature (or anyone else) changes the data
    document.addEventListener('sessionDeleted', loadSessions);

    loadSessions();
});