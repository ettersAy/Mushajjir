# Problem
Agents must manually remember to run lint and format before each commit. There is no automated enforcement.

# Improvement Needed
Set up Husky + lint-staged to auto-run `eslint --fix` and `prettier --write` on staged files before every commit.

# Expected Result
Agents no longer need to manually invoke lint/format commands — quality gates are enforced automatically.
