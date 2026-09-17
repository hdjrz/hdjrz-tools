# Antigravity Project Rules: hdjrzTools

## Mandatory Versioning & Release Protocol

Whenever code changes are made and pushed to the repository:

1. **Version Synchronization**:
   - Increment the version number in `package.json`, `manifest.json`, and `backend/services/systemService.js`.
   - Always run `npm run build` to update `dist/bundle.js` and `hdjrzTools.user.js` with the new version header.
   - Commit and push all changes to `origin/main`.

2. **Explicit Version Announcement to User**:
   - At the conclusion of every build and push, **always prominently display the exact version pushed** (e.g. `v1.4.7`).
   - Provide the direct update link: `https://hdjrz-license.rosechel05.workers.dev/script.user.js`.

3. **Web Admin Portal Channel Instructions**:
   - Prompt the user to update the version targets in their **Web Admin Portal** (`https://hdjrz-license.rosechel05.workers.dev/admin`):
     - **👑 Admin Preview Channel**: If this is an early access or admin-only test version, advise setting `adminLatestVersion` to this new version.
     - **🛡️ Agent Fleet Channel**: If ready for all staff, advise clicking **"🚀 Promote to Fleet (1-Click)"** or setting `agentLatestVersion` and clicking **"Save Release Targets"**.
