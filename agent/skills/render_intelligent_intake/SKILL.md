---
name: smart-form-generator
description: Triggers when the user asks to create, design, or code UI forms, input fields, or data entry components based on a schema, JSON object, or natural language requirements.
---

### Objective
Generate production-ready UI forms with integrated validation logic and accessible (ARIA) structures.

### Step-by-Step Instructions
1. **Analyze Data Model:** Identify field types (string, email, date, etc.) and required constraints.
2. **Select Framework:** Default to React + Tailwind + Zod/React Hook Form unless specified otherwise.
3. **Structure Output:** - Define the Validation Schema (Zod/Joi).
   - Generate the UI Component.
   - Include Error Handling and Loading states.

### Validation Checklist
- [ ] Are all fields correctly typed?
- [ ] Is there a "submit" and "cancel/reset" button?
- [ ] Does it follow WCAG accessibility standards?

### Constraints
- Never hardcode API endpoints; use a `submitHandler` prop.
- Maximize component atomicity (separate inputs from form logic).