# DevLumen Test Dataset - Jira Tasks & GitHub PR Workflow

## Overview
This document contains the test dataset generated for DevLumen performance analysis system. It includes Jira tasks, GitHub branches, commits, and PR workflow simulation for a realistic team environment.

---

## Team Member Mapping

| Alias | Role | Name | Email |
|-------|------|------|-------|
| **FE** | Founding Engineer | Kavinda Senarathne | kavindasenarathne94@gmail.com |
| **PM** | Pick Me / Product | Yasiru Swaris | yasiruswaris@gmail.com |
| **TL** | Tech Lead | Obhasha | Obhasha@live.com |
| **INT1** | Intern | Chamindu JS | chamindujs@gmail.com |
| **SE** | Software Engineer | Kavish Can | kavishcan2002@gmail.com |
| **INT2** | Intern | Kirulu | Kirulu11@gmail.com |
| **ASE1** | Associate SE | Pasindu E | pasindue@outlook.com |
| **INT3** | Intern | Yasith Hennayake | yasith.hennayake@gmail.com |
| **ASE2** | Associate SE | Shakya Dhamindu | Shakyadhamindu@gmail.com |
| **ASE3** | Associate SE | Dihas Liyanage | dihasliyanage42@gmail.com |
| **SSE** | Senior Software Engineer | Nimna Perera | nimnaperera98@gmail.com |
| **ASE4** | Associate SE | Senarathna Koliya | senarathnakoliya@gmail.com |
| **TA** | Technology Associate | Thevinu Senaratne | thevinusenaratne@gmail.com |

---

## Jira Task Table

| Task Key | Title | Description | Difficulty | Estimate | Assignee(s) | Reviewer(s) | Branch Name | PR Title | Commit Message |
|----------|-------|-------------|------------|----------|-------------|-------------|-------------|----------|----------------|
| **PERF-101** | Add Dark Mode Toggle | Implement dark mode toggle in Navbar with localStorage persistence | Medium | 4h | ASE1 | TL, SSE | `feature/PERF-101-dark-mode-toggle` | `[PERF-101] Add Dark Mode Toggle` | `PERF-101: Add dark mode toggle functionality` |
| **PERF-102** | Fix API Error Responses | Standardize error response format with proper HTTP status codes | Easy | 2h | INT1 | SE, TL | `feature/PERF-102-api-error-format` | `[PERF-102] Standardize API Error Responses` | `PERF-102: Standardize API error response format` |
| **PERF-103** | Add Search Debounce | Implement 300ms debounce on SearchBox to reduce unnecessary API calls | Easy | 2h | INT2 | ASE1, SSE | `feature/PERF-103-search-debounce` | `[PERF-103] Add Search Input Debounce` | `PERF-103: Add debounce to search input` |
| **PERF-104** | Session Timeout Handler | Add auto-logout on session expiry with 5min warning modal | Hard | 8h | **SE, ASE2** (Collab) | FE, TL | `feature/PERF-104-session-timeout` | `[PERF-104] Implement Session Timeout Handler` | `PERF-104: Add session timeout with warning` |
| **PERF-105** | Toast Notification System | Create reusable toast component with success/error/warning types | Medium | 5h | ASE3 | SSE, TL | `feature/PERF-105-toast-notifications` | `[PERF-105] Create Toast Notification System` | `PERF-105: Create toast notification component` |
| **PERF-106** | Request Logging Middleware | Implement structured HTTP request/response logging | Easy | 3h | INT3 | ASE1, SE | `feature/PERF-106-request-logging` | `[PERF-106] Add Request Logging Middleware` | `PERF-106: Add HTTP request logging middleware` |
| **PERF-107** | Password Visibility Toggle | Add show/hide toggle to password input fields | Easy | 2h | ASE4 | TL, SSE | `feature/PERF-107-password-toggle` | `[PERF-107] Add Password Visibility Toggle` | `PERF-107: Add password visibility toggle` |
| **PERF-108** | Health Check Endpoint | Add /health and /ready endpoints for container orchestration | Easy | 2h | TA | SE, FE | `feature/PERF-108-health-check` | `[PERF-108] Create Health Check Endpoints` | `PERF-108: Add health check endpoints` |
| **PERF-109** | User Avatar Component | Build avatar upload component with preview, crop, and validation | Hard | 10h | **ASE1, INT1, ASE3** (Collab) | FE, TL, SSE | `feature/PERF-109-avatar-upload` | `[PERF-109] Implement User Avatar Upload` | `PERF-109: Implement avatar upload component` |
| **PERF-110** | CORS Configuration | Configure CORS middleware with environment-based allowed origins | Medium | 4h | ASE2 | SSE, TL | `feature/PERF-110-cors-config` | `[PERF-110] Add CORS Configuration` | `PERF-110: Add CORS middleware configuration` |

---

## Task Difficulty Distribution

| Difficulty | Count | Tasks | Total Estimate |
|------------|-------|-------|----------------|
| **Easy** | 5 | PERF-102, PERF-103, PERF-106, PERF-107, PERF-108 | 11h |
| **Medium** | 3 | PERF-101, PERF-105, PERF-110 | 13h |
| **Hard** | 2 | PERF-104, PERF-109 | 18h |
| **Total** | **10** | - | **42h** |

---

## Collaborative Tasks (2 tasks with multiple assignees)

### PERF-104: Session Timeout Handler
- **Assignees:** SE (Kavish Can), ASE2 (Shakya Dhamindu)
- **Commits:**
  1. `PERF-104: Add session timeout warning modal component` - Kavish Can
  2. `PERF-104: Add session timeout hook with activity tracking` - Shakya Dhamindu

### PERF-109: User Avatar Component
- **Assignees:** ASE1 (Pasindu E), INT1 (Chamindu JS), ASE3 (Dihas Liyanage)
- **Commits:**
  1. `PERF-109: Add avatar upload component with validation` - Pasindu E
  2. `PERF-109: Add avatar API endpoints` - Chamindu JS
  3. `PERF-109: Add avatar upload styles` - Dihas Liyanage

---

## Git Branches Created

| Branch Name | Base Branch | Status |
|-------------|-------------|--------|
| `feature/PERF-101-dark-mode-toggle` | main | Pushed |
| `feature/PERF-102-api-error-format` | main | Pushed |
| `feature/PERF-103-search-debounce` | main | Pushed |
| `feature/PERF-104-session-timeout` | main | Pushed |
| `feature/PERF-105-toast-notifications` | main | Pushed |
| `feature/PERF-106-request-logging` | main | Pushed |
| `feature/PERF-107-password-toggle` | main | Pushed |
| `feature/PERF-108-health-check` | main | Pushed |
| `feature/PERF-109-avatar-upload` | main | Pushed |
| `feature/PERF-110-cors-config` | main | Pushed |

---

## Commits Summary (13 total)

| Commit Hash | Author | Email | Commit Message | Branch |
|-------------|--------|-------|----------------|--------|
| `ddb7490` | Pasindu E | pasindue@outlook.com | PERF-101: Add dark mode toggle functionality | feature/PERF-101-dark-mode-toggle |
| `4e98a92` | Chamindu JS | chamindujs@gmail.com | PERF-102: Standardize API error response format | feature/PERF-102-api-error-format |
| `65e1ee7` | Kirulu | Kirulu11@gmail.com | PERF-103: Add debounce to search input | feature/PERF-103-search-debounce |
| `695a637` | Kavish Can | kavishcan2002@gmail.com | PERF-104: Add session timeout warning modal component | feature/PERF-104-session-timeout |
| `932888c` | Shakya Dhamindu | Shakyadhamindu@gmail.com | PERF-104: Add session timeout hook with activity tracking | feature/PERF-104-session-timeout |
| `6c94b37` | Dihas Liyanage | dihasliyanage42@gmail.com | PERF-105: Create toast notification component | feature/PERF-105-toast-notifications |
| `1d1e20f` | Yasith Hennayake | yasith.hennayake@gmail.com | PERF-106: Add HTTP request logging middleware | feature/PERF-106-request-logging |
| `1f18437` | Senarathna Koliya | senarathnakoliya@gmail.com | PERF-107: Add password visibility toggle | feature/PERF-107-password-toggle |
| `812d33f` | Thevinu Senaratne | thevinusenaratne@gmail.com | PERF-108: Add health check endpoints | feature/PERF-108-health-check |
| `8d0e92c` | Pasindu E | pasindue@outlook.com | PERF-109: Add avatar upload component with validation | feature/PERF-109-avatar-upload |
| `2168853` | Chamindu JS | chamindujs@gmail.com | PERF-109: Add avatar API endpoints | feature/PERF-109-avatar-upload |
| `fbdff39` | Dihas Liyanage | dihasliyanage42@gmail.com | PERF-109: Add avatar upload styles | feature/PERF-109-avatar-upload |
| `20cf70b` | Shakya Dhamindu | Shakyadhamindu@gmail.com | PERF-110: Add CORS middleware configuration | feature/PERF-110-cors-config |

---

## Pull Request Workflow

### PR Template Format

```
## Summary
[Brief description of changes]

## Jira Task
[PERF-XXX](link-to-jira-task)

## Changes Made
- [List of changes]

## Testing Done
- [Testing steps]

## Screenshots (if applicable)
[Add screenshots]
```

### PR Review Matrix

| PR | Branch | Author(s) | Reviewer(s) | Review Type |
|----|--------|-----------|-------------|-------------|
| #1 | feature/PERF-101-dark-mode-toggle | Pasindu E | Obhasha (TL), Nimna Perera (SSE) | Code Review + Approval |
| #2 | feature/PERF-102-api-error-format | Chamindu JS | Kavish Can (SE), Obhasha (TL) | Code Review + Approval |
| #3 | feature/PERF-103-search-debounce | Kirulu | Pasindu E (ASE1), Nimna Perera (SSE) | Code Review + Approval |
| #4 | feature/PERF-104-session-timeout | Kavish Can, Shakya Dhamindu | Kavinda Senarathne (FE), Obhasha (TL) | Code Review + Approval |
| #5 | feature/PERF-105-toast-notifications | Dihas Liyanage | Nimna Perera (SSE), Obhasha (TL) | Code Review + Approval |
| #6 | feature/PERF-106-request-logging | Yasith Hennayake | Pasindu E (ASE1), Kavish Can (SE) | Code Review + Approval |
| #7 | feature/PERF-107-password-toggle | Senarathna Koliya | Obhasha (TL), Nimna Perera (SSE) | Code Review + Approval |
| #8 | feature/PERF-108-health-check | Thevinu Senaratne | Kavish Can (SE), Kavinda Senarathne (FE) | Code Review + Approval |
| #9 | feature/PERF-109-avatar-upload | Pasindu E, Chamindu JS, Dihas Liyanage | Kavinda Senarathne (FE), Obhasha (TL), Nimna Perera (SSE) | Code Review + Approval |
| #10 | feature/PERF-110-cors-config | Shakya Dhamindu | Nimna Perera (SSE), Obhasha (TL) | Code Review + Approval |

---

## Files Created/Modified

### New Files Created (15 files)

| File Path | Task | Author |
|-----------|------|--------|
| `src/components/SessionTimeoutModal.js` | PERF-104 | Kavish Can |
| `src/hooks/useSessionTimeout.js` | PERF-104 | Shakya Dhamindu |
| `src/components/Toast.js` | PERF-105 | Dihas Liyanage |
| `src/components/Toast.css` | PERF-105 | Dihas Liyanage |
| `src/middleware/requestLogger.js` | PERF-106 | Yasith Hennayake |
| `src/components/PasswordInput.js` | PERF-107 | Senarathna Koliya |
| `src/components/PasswordInput.css` | PERF-107 | Senarathna Koliya |
| `src/api/healthRoutes.js` | PERF-108 | Thevinu Senaratne |
| `src/components/AvatarUpload.js` | PERF-109 | Pasindu E |
| `src/api/avatarRoutes.js` | PERF-109 | Chamindu JS |
| `src/components/AvatarUpload.css` | PERF-109 | Dihas Liyanage |
| `src/middleware/corsConfig.js` | PERF-110 | Shakya Dhamindu |

### Modified Files (3 files)

| File Path | Task | Author |
|-----------|------|--------|
| `src/components/Navbar.js` | PERF-101 | Pasindu E |
| `src/api/auth.js` | PERF-102 | Chamindu JS |
| `src/components/SearchBox.js` | PERF-103 | Kirulu |

---

## Developer Contribution Summary

| Developer | Role | Tasks Assigned | Commits | Files Changed |
|-----------|------|----------------|---------|---------------|
| Pasindu E | ASE1 | PERF-101, PERF-109 | 2 | 2 |
| Chamindu JS | INT1 | PERF-102, PERF-109 | 2 | 2 |
| Kirulu | INT2 | PERF-103 | 1 | 1 |
| Kavish Can | SE | PERF-104 | 1 | 1 |
| Shakya Dhamindu | ASE2 | PERF-104, PERF-110 | 2 | 2 |
| Dihas Liyanage | ASE3 | PERF-105, PERF-109 | 2 | 3 |
| Yasith Hennayake | INT3 | PERF-106 | 1 | 1 |
| Senarathna Koliya | ASE4 | PERF-107 | 1 | 2 |
| Thevinu Senaratne | TA | PERF-108 | 1 | 1 |

---

## Repository Information

- **Repository:** https://github.com/Thivi033/DEMO-Project-
- **Main Branch:** main
- **Total Branches Created:** 10
- **Total Commits:** 13
- **Date Generated:** 2026-02-02

---

## Notes

1. **Reviewer Hierarchy:** PRs are reviewed by higher roles (TL, SSE, FE, SE) to simulate real team dynamics
2. **Collaborative Tasks:** PERF-104 and PERF-109 have multiple assignees working together
3. **Branch Naming Convention:** `feature/PERF-XXX-short-description`
4. **Commit Message Format:** `PERF-XXX: Description of changes`
5. **All branches are based off `main` branch**
