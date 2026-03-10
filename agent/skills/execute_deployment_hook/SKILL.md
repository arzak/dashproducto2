---
name: deployment-lifecycle-hook
description: Triggers when the user mentions deployment, CI/CD pipelines, staging/production releases, or post-deployment validation tasks.
---

### Objective
Manage the transition of code from local to production environment ensuring zero-downtime and health checks.

### Step-by-Step Instructions
1. **Environment Check:** Verify target environment (Staging vs Production).
2. **Pre-flight Logic:** Run linting, unit tests, and security audits.
3. **Execution:** Generate the configuration (YAML for GitHub Actions, GitLab CI, or Docker Compose).
4. **Post-deployment:** Define a `health-check` script to verify endpoint status.

### Logic (scripts/deploy-check.sh)
> Recommendation: Create a shell script to verify HTTP 200 after deployment.

### Validation Checklist
- [ ] Are secrets/env variables handled via secure providers?
- [ ] Is there a rollback strategy defined?
- [ ] Is the build artifact optimized (minified/compressed)?