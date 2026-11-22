# DVOPS-Project-MindFlow
This is the DVOPS Project for Group 2

## API: Log Focus Session

`POST /log-session`

Request body (JSON):
```json
{
  "subject": "DevOps Essentials",
  "date": "2026-11-22",
  "startTime": "09:00",
  "endTime": "10:30"
}
```

| Status | Meaning |
|---|---|
| 201 | Session logged successfully |
| 400 | Missing or invalid data (blank subject, invalid date or time, end time not after start time) |
| 409 | Time slot overlaps an existing session on the same date |
