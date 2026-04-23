# Vision: Citizen Issue Reporting — Bar, Montenegro

## Overview

A web application that lets citizens of Bar report problems they observe in public spaces — broken infrastructure, illegal dumping, damaged signage, and similar urban issues — and lets town hall staff manage and resolve those reports. The goal is a short, transparent feedback loop between citizens and the municipality.

---

## Users

### Citizen
Any resident or visitor with a browser. No account required. Citizens submit reports and can optionally leave a phone number so staff can follow up. They receive no login, no dashboard — just a confirmation that their report was received.

### Employee
A town hall staff member with a verified account. Employees see all submitted reports, can update their status as work progresses, and can add internal notes. They cannot manage other accounts.

### Administrator
A senior staff member with full system access. In addition to everything an Employee can do, the Administrator can create Employee accounts and deactivate or remove them. There is at least one Administrator in the system at all times.

---

## Core Functionality

### Viewing existing reports (Public)
Anyone can view a public map of all submitted reports, with photos and descriptions. This promotes transparency and allows citizens to see if their issue has already been reported. The public view does not show reporter phone numbers or internal staff notes.

### Submitting a Report (Citizen)
A citizen opens the app and fills out a simple form:

- **Photo** — one or more images of the issue.
- **Location** — either captured automatically via GPS or placed manually on a map.
- **Comment** — a free-text description of the problem.
- **Phone number** *(optional)* — for staff to contact the reporter if clarification is needed.

On submission the citizen sees a confirmation with a reference number they can save.

### Viewing Reports (Employee & Administrator)
Staff see a list and a map view of all reports. Each report displays the submitted photo(s), location pin, comment, reporter phone number (if provided), submission date, and current status. Reports can be filtered by status, date range, and location area.

### Managing Report Status (Employee & Administrator)
A report moves through a defined lifecycle:

- **New** — just submitted, not yet reviewed.
- **In Progress** — assigned and being worked on.
- **Resolved** — the issue has been fixed.
- **Rejected** — the report was a duplicate, out of jurisdiction, or otherwise invalid.

Staff update the status manually and may add a note explaining the change. The history of status changes is preserved on the report.

### Managing Staff Accounts (Administrator)
The Administrator can:

- Create a new Employee account (name, email, temporary password).
- Deactivate an Employee account so the person can no longer log in.
- Permanently remove an Employee account.

---

## Key Principles

- **No friction for citizens** — reporting requires no registration and works on mobile.
- **Full visibility for staff** — every report is visible to all employees; nothing is siloed.
- **Auditability** — dates, status history, and account actions are logged and never deleted.
- **Privacy by default** — reporter phone numbers are accessible to staff only, never exposed publicly.
