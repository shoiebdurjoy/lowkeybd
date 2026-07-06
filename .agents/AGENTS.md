# LowKeyBD Project Guidelines

## Git & Commit Practices
- All development must use Git with professional commit practices.
- Commit after every meaningful feature, bug fix, refactor, migration, or milestone.
- Use Conventional Commit messages:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `refactor:` for code refactoring
  - `docs:` for documentation updates
  - `chore:` for build tools, dependencies, or auxiliary actions
  - `style:` for formatting, missing semi-colons, style changes
  - `test:` for adding or fixing tests
- After every successful commit:
  - Push to `origin main`.
  - Verify the push succeeded.
  - Continue development automatically.
- If GitHub authentication is required, stop and ask the user once.

## Pre-Commit Verification
Never push broken code. Before every commit, run the following verification steps:
1. Run lint check.
2. Run typecheck.
3. Verify the frontend builds successfully.
4. Verify the backend builds/runs successfully.
5. Fix any errors before committing or pushing.

## Roadmap & Blueprint
- Follow the instructions in [LowKeyBD-Phase-1-Blueprint.md](file:///f:/projects/Help/LowKeyBD-Phase-1-Blueprint.md) until the project is complete.
- Create commits frequently so the repository history clearly shows day-by-day progress.
