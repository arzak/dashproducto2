---
name: rbac-security-manager
description: Defines and enforces Role-Based Access Control (RBAC) for Admin, PM, and Developer roles using Firebase Auth and Firestore.
---

# Objective
Ensure that only authorized roles can perform specific actions (e.g., PMs prioritize, Admins see global KPIs).

# Roles & Permissions
- **Admin:** Read all, Write all, Access Global Dashboard.
- **Project Manager (PM):** Manage Backlog, Assign Users, Edit Budgets.
- **Developer:** Update status (Kanban), Log activity, View assigned tasks.

# Implementation Steps
1. Define a `users` collection in Firestore where each doc ID is the Firebase Auth UID.
2. Use Custom Claims or a `role` field in the document.
3. React Context: Create an `AuthProvider` that exports `currentUser` and `role`.

# Constraints
- Never allow a 'Developer' to access the `admin/` route.
- Always use Google OAuth for authentication.

# Validation Checklist
- [ ] Does the UI hide buttons (e.g., "Delete Project") based on role?
- [ ] Are Firestore Security Rules aligned with these roles?