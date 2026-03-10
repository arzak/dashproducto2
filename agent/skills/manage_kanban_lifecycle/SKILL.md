---
name: kanban-flow-controller
description: Manages the state transitions of requirements (Backlog -> To Do -> In Progress -> Review -> Done) and real-time updates.
---

# Objective
Maintain a deterministic Kanban flow and ensure the "Real-Time" requirement is met via Firebase snapshots.

# Workflow Logic
1. **Transitions:** When a requirement moves, update the `status` and set a `status_{name}_at` timestamp.
2. **Persistence:** Use `onSnapshot` in React to sync the Kanban board instantly.
3. **Validation:** A requirement cannot move to 'Done' without a 'Review' timestamp.

# UI Component (React + Tailwind)
- Use `dnd-kit` or `react-beautiful-dnd` for the drag-and-drop interface.
- Cards must change color/border if a requirement is "Blocked" (High Priority).

# Validation Checklist
- [ ] Does moving a card trigger a Firestore update?
- [ ] Is there a loading state for optimistic UI updates?