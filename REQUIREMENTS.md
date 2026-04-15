# Requirements: Public Infrastructure Issue Reporting

## Overview

A web application allowing citizens of Bar, Montenegro to report issues on public infrastructure. Reports are submitted to the municipality for review and resolution.

---

## Functional Requirements

### 1. Issue Submission

- Citizens can submit a new issue report without creating an account (anonymous submission supported).
- Required fields:
  - **Photo** — optional image upload (JPEG/PNG, max 5 MB) (uses phone camera if available)
  - **Description** — free-text description of the issue (max 4096 characters)
  - **Location** — either taken from GPS or picked on an interactive map
- Optional fields:
  - **Contact number** — so the municipality can follow up with the reporter
- On submission, the citizen receives a unique tracking code.

### 2. Public Issue Map

- A map view displaying all open (non-resolved, non-rejected) issues as pins.
- Pins are color-coded by category.
- Clicking a pin shows issue details (category, description, date submitted, status).
- No personally identifiable information is shown on the public map.

### 3. Admin

- Single admin account that allows adding users for municipality staff
- admin credentials read from env vars


### 4. Municipality Staff Dashboard

- Accessible via username/password login (staff accounts only).
- Lists all submitted issues with filters for: status, date range.
- Staff can:
  - Change the status of an issue
  - Categorise issues
  - Add internal notes (private) and public notes (visible to the reporter)
  - Assign an issue to a department or individual
  - Close an issue as Resolved or Rejected with a required comment and optional photo

### 5. Notifications

- If a contact number was provided, the citizen receives an SMS when:
  - Their report is confirmed (submission receipt)
  - The status changes
  - A public note is added

---

## Non-Functional Requirements

- **Language:** UI available in Montenegrin (primary) and English.
- **Accessibility:** WCAG 2.1 AA compliance.
- **Mobile-first:** fully usable on smartphones.
- **Performance:** issue submission form loads in under 3 seconds on a 4G connection.
- **Data retention:** reports and associated data retained for a minimum of 5 years.
- **Privacy:** compliant with GDPR; contact numbers are not displayed publicly and are used only for status notifications.

---

## Out of Scope (for this demo)

- Integration with existing municipal back-office systems
- User registration / citizen accounts
- Multi-municipality support
- Native mobile apps

---

## Tech Stack (Proposed)

| Layer | Choice |
|---|---|
| Frontend | React (TypeScript) |
| Backend | Node.js / Express |
| Database | PostgreSQL |
| Maps | Leaflet.js + OpenStreetMap |
| Auth (staff) | JWT + bcrypt |
| SMS | 

---

## Key User Roles

| Role | Description |
|---|---|
| Citizen | Submits and tracks issue reports. No account required. |
| Staff | Municipality employee who reviews and resolves reports. |
| Admin | Staff member who manages staff accounts and system settings. |
