# DVOPS-Project-MindFlow
This is the DVOPS Project for Group 2

## API Reference

### Log Focus Session — `POST /log-session`

Logs a new study or focus session after validating input fields and checking for overlapping time slots on the same date.

#### Request Body (`application/json`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `subject` | string | Yes | Topic or task name (non-empty, max 50 characters). |
| `date` | string | Yes | Valid calendar date in `YYYY-MM-DD` format. |
| `startTime` | string | Yes | Session start time in 24-hour `HH:MM` format. |
| `endTime` | string | Yes | Session end time in 24-hour `HH:MM` format (must be later than `startTime`). |

#### Example Request

```json
{
  "subject": "Linear Algebra Study",
  "date": "2026-11-22",
  "startTime": "10:00",
  "endTime": "11:30"
}
