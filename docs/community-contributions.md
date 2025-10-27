# Community Contributions

Welcome — this page explains the quickest ways to get involved with web-platform-tests (WPT).

## Quick start (for first-time contributors)
1. Fork the repository (`https://github.com/web-platform-tests/wpt`) and clone your fork.
2. Create a branch for your change:

   ```bash
   git checkout -b docs/community-contributions
   ```

3. Make a small change (typo fix, docs clarification, small test, or small metadata fix).
4. Push and open a pull request (see "Submit a PR" below).

## Filing issues
- Search existing issues before opening a new one.
- Use a clear title and short reproduction steps (if applicable).
- Add labels or mention areas (e.g. `docs`, `test`, `infra`) to help triage.

## Submitting Pull Requests
- Follow the repo's contribution conventions. See `./wpt lint` and run local checks if relevant.
- Make small, focused PRs — one logical change per PR.
- Link the PR to the issue by mentioning `Closes #48514` (if applicable).
- Use a clear commit message and PR title; include a short description of what you changed and why.

## Reviewing Tests
- If you want to review tests, look for the `review` and `good first issue` labels.
- When reviewing: verify the test reproduces the issue, check cross-browser relevance, and ensure no privileged APIs are used without justification.

## Community & communication
- Matrix chat: (add active Matrix link here / see repo README)
- Mailing list / developer channels: (see repo README)
- For major proposals, open an RFC in `web-platform-tests/rfcs` or start a discussion in GitHub Discussions.

## Showcase / Recognition
We welcome highlighting notable contributions. If you'd like a short mention here (contributor + summary), open an issue and propose the text.

---

Thank you for contributing — every small change helps keep WPT useful and welcoming.
