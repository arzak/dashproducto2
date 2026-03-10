---
name: dashboard-ui-renderer
description: Activates when the user needs to visualize data, create analytical layouts, charts, KPIs, or complex admin interfaces.
---

### Objective
Translate raw data structures into intuitive, grid-based dashboard layouts.

### Step-by-Step Instructions
1. **Layout Mapping:** Define the grid system (usually 12 columns).
2. **KPI Identification:** Extract "North Star" metrics for top-level cards.
3. **Visualization Selection:**
   - Trends -> Line Charts.
   - Comparisons -> Bar Charts.
   - Distribution -> Pie/Donut.
4. **Implementation:** Use libraries like Recharts, Chart.js, or Tremor.

### Few-Shot Example
*User:* "Show me sales by region for last month."
*Agent:* [Renders a Grid with 4 KPI cards and 1 Map component + 1 Bar chart].

### Validation Checklist
- [ ] Is the layout responsive (Mobile/Desktop)?
- [ ] Are color palettes consistent and accessible?
- [ ] Is data being memoized to prevent re-renders?