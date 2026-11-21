// Frontend logic for: Update Focus Session

const updateForm = document.getElementById('update-session-form');
const messageBox = document.getElementById('update-message');

function showMessage(text, isError) {
  messageBox.textContent = text;
  messageBox.className = isError ? 'message error' : 'message success';
}

function toMinutes(time) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return match ? parseInt(match[1], 10) * 60 + parseInt(match[2], 10) : null;
}

// Returns an error string, or null if the input is valid
function validateInput({ id, subject, date, startTime, endTime }) {
  if (!id) return 'Session ID is required.';
  if (!subject.trim() || !date || !startTime || !endTime) {
    return 'Subject, date, start time and end time are required.';
  }
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start === null || end === null) return 'Times must be in HH:MM (24-hour) format.';
  if (end <= start) return 'End time must be later than start time.';
  return null;
}

async function updateSession(event) {
  event.preventDefault();

  const id = document.getElementById('update-session-id').value.trim();
  const payload = {
    subject: document.getElementById('update-subject').value,
    date: document.getElementById('update-date').value,
    startTime: document.getElementById('update-start-time').value,
    endTime: document.getElementById('update-end-time').value,
    notes: document.getElementById('update-notes').value
  };

  // Frontend validation: quick feedback before hitting the server
  const error = validateInput({ id, ...payload });
  if (error) {
    showMessage(error, true);
    return;
  }

  try {
    const response = await fetch(`/update-session/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (response.ok) {
      showMessage(result.message, false);
    } else {
      // 400 validation, 404 not found, 409 overlap, 500 server error
      showMessage(result.message || 'Something went wrong.', true);
    }
  } catch (err) {
    console.error(err);
    showMessage('Could not reach the server. Please try again.', true);
  }
}

if (updateForm) {
  updateForm.addEventListener('submit', updateSession);
}