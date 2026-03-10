---
name: requirements-data-architect
description: Calculates agile performance metrics like Cycle Time, Lead Time, Throughput, and Project Health Score (0-100). Trigger when the user asks for dashboard logic or KPI calculations.
---

# Objective
Transform raw Firestore timestamps into actionable agile insights (Cycle Time, Lead Time, CPI/SPI).

# Instructions
1. **Cycle Time:** Calculate the difference between `status_in_progress_at` and `status_done_at`.
2. **Lead Time:** Calculate the difference between `created_at` and `status_done_at`.
3. **Health Score (0-100):** - 40% Weight: On-time delivery (Actual vs. Estimated).
   - 30% Weight: Budget efficiency (CPI).
   - 30% Weight: Lack of blockers.
4. **CFD Data:** Aggregate count of requirements per status grouped by date.

# Constraints
- Use `date-fns` for all date manipulations.
- If a requirement is not 'Done', Cycle Time must be marked as 'In Progress'.

# Validation Checklist
- [ ] Are all time units consistent (days/hours)?
- [ ] Is the Health Score prevented from going below 0 or above 100?