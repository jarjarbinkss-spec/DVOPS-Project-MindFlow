// DELETE feature (frontend): adds a Delete button to every row shown by view-sessions.js

function showDeleteMessage(text, type) {
    var box = document.getElementById('deleteMessage');
    box.textContent = text;
    box.className = 'message ' + type;
}

// Send the delete request for one session
function deleteSession(id, subject) {
    // Client-side validation of the id
    if (!/^[1-9]\d*$/.test(String(id))) {
        showDeleteMessage('This session has an invalid id and cannot be deleted.', 'error');
        return;
    }

    if (!window.confirm('Delete the session "' + subject + '"? This cannot be undone.')) {
        return;
    }

    var request = new XMLHttpRequest();
    request.open('DELETE', '/delete-session/' + id, true);

    request.onload = function () {
        var response;
        try {
            response = JSON.parse(request.responseText);
        } catch (e) {
            showDeleteMessage('Unexpected response from the server.', 'error');
            return;
        }

        if (request.status === 200) {
            showDeleteMessage(response.message, 'success');
            document.dispatchEvent(new CustomEvent('sessionDeleted'));
        } else {
            // 400 (invalid id), 404 (not found) or 500 (server error)
            showDeleteMessage(response.message, 'error');
            if (request.status === 404) {
                // The row is stale (deleted elsewhere), so refresh the list
                document.dispatchEvent(new CustomEvent('sessionDeleted'));
            }
        }
    };

    request.onerror = function () {
        showDeleteMessage('Unable to reach the server.', 'error');
    };

    request.send();
}

// Add a Delete button to each row whenever the list is (re)drawn
function addDeleteButtons() {
    var rows = document.querySelectorAll('#sessionsTableBody tr');
    rows.forEach(function (row) {
        var cell = row.querySelector('.sessionActionCell');
        if (!cell || cell.querySelector('button')) return;

        var id = row.getAttribute('data-id');
        var subject = row.getAttribute('data-subject');

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'deleteSessionBtn';
        button.textContent = 'Delete';
        button.setAttribute('aria-label', 'Delete session ' + subject);
        button.addEventListener('click', function () {
            deleteSession(id, subject);
        });
        cell.appendChild(button);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('sessionsRendered', addDeleteButtons);
});