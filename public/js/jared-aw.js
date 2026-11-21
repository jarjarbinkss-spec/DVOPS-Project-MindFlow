// Member 1 (Jared Aw): Log Focus Session - frontend logic

// Convert "HH:MM" to minutes since midnight
function timeToMinutes(time) {
    var parts = time.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// Show a success / error message under the form
function showSessionMessage(text, type) {
    var box = document.getElementById('sessionMessage');
    box.textContent = text;
    box.className = 'message ' + type;
}

// Show the calculated duration as the user fills in the times
function updateDurationPreview() {
    var startTime = document.getElementById('sessionStart').value;
    var endTime = document.getElementById('sessionEnd').value;
    var preview = document.getElementById('durationPreview');

    if (startTime && endTime) {
        var minutes = timeToMinutes(endTime) - timeToMinutes(startTime);
        preview.textContent = minutes > 0 ? 'Duration: ' + minutes + ' minutes' : 'Duration: invalid';
    } else {
        preview.textContent = 'Duration: -';
    }
}

// Client-side validation. Returns an error message, or '' if the input is fine.
function validateSessionForm(data) {
    if (data.subject.trim() === '') {
        return 'Subject is required.';
    }
    if (data.subject.trim().length > 50) {
        return 'Subject must be at most 50 characters.';
    }
    if (data.date === '') {
        return 'Date is required.';
    }
    if (data.startTime === '' || data.endTime === '') {
        return 'Start time and end time are required.';
    }
    if (timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)) {
        return 'End time must be later than start time.';
    }
    return '';
}

// Send the focus session to the backend
function logSession() {
    var jsonData = {
        subject: document.getElementById('sessionSubject').value,
        date: document.getElementById('sessionDate').value,
        startTime: document.getElementById('sessionStart').value,
        endTime: document.getElementById('sessionEnd').value
    };

    var validationError = validateSessionForm(jsonData);
    if (validationError !== '') {
        showSessionMessage(validationError, 'error');
        return;
    }

    var request = new XMLHttpRequest();
    request.open('POST', '/log-session', true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () {
        var response = JSON.parse(request.responseText);

        if (request.status === 201) {
            var s = response.session;
            showSessionMessage(
                response.message + ' ' + s.subject + ', ' + s.date + ', ' +
                s.startTime + ' - ' + s.endTime + ' (' + s.durationMinutes + ' min)',
                'success'
            );
            document.getElementById('sessionSubject').value = '';
            document.getElementById('sessionStart').value = '';
            document.getElementById('sessionEnd').value = '';
            updateDurationPreview();
        } else {
            // 400 (invalid data), 409 (overlap) or 500 (server error)
            showSessionMessage(response.message, 'error');
        }
    };

    request.onerror = function () {
        showSessionMessage('Unable to reach the server.', 'error');
    };

    request.send(JSON.stringify(jsonData));
}

document.addEventListener('DOMContentLoaded', function () {
    // Default the date to today (local time)
    var now = new Date();
    var today = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
    document.getElementById('sessionDate').value = today;

    document.getElementById('sessionStart').addEventListener('input', updateDurationPreview);
    document.getElementById('sessionEnd').addEventListener('input', updateDurationPreview);

    document.getElementById('logSessionForm').addEventListener('submit', function (event) {
        event.preventDefault();
        logSession();
    });
});
