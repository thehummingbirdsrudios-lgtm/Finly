# ADDON-24 — Stop and reassess the whole project from the beginning

Received 2026-10-10 while the API deployment was being verified, followed by `@"D:\Finely\docs\source/"` and "Create
new plan and build the mobile app". It led to the three-part audit and master plan v3 (docs/PLAN.md). Recorded
verbatim below the line.

---

Stop and reassess the entire Finly mobile app project from the beginning. Read and understand everything before deciding what to build.

1. Read all source documents: Inspect every relevant project folder and file, including SRS documents, requirements, specifications, feature lists, previous prompts, notes, change requests, design files, screenshots, API documentation, database schemas, configuration files, and existing source code. Check all available sources for what we are building, what has changed, and what has been agreed upon. Do not skip relevant files or rely only on summaries.
2. Audit the complete project: Understand the existing Flutter application, backend, database, integrations, dependencies, screens, features, accounting logic, authentication, and deployment setup. Identify what is complete, incomplete, broken, duplicated, missing, or inconsistent. Verify existing implementations directly rather than assuming they work.
3. Reconcile every requirement and change: Combine the original requirements with all subsequent additions, corrections, decisions, and updated instructions. Identify conflicting or outdated requirements and resolve them using the latest explicit decisions while preserving important original requirements. Do not silently omit, replace, or invent features.
4. Create a fresh master development plan: Update the complete feature list, technical architecture, implementation sequence, dependencies, testing strategy, and deployment requirements. Maintain a requirement-traceability checklist linking each requirement to its implementation location and verification status. Clearly distinguish existing working functionality from unfinished work.
5. Start implementation immediately: After the audit and planning, begin modifying the actual project code. Implement the revised plan systematically, preserve existing working functionality and financial data, integrate all components, and avoid unnecessary rewrites. Build and test each feature, fix discovered errors, and continue with the next task without waiting for approval at every stage.
6. Continue until delivery: Keep the master plan and checklist updated as requirements change or new gaps are discovered. Run appropriate tests, verify accounting correctness and security, build the Flutter application, and prepare the release-ready Android APK and deployment documentation. Report completed work, test results, remaining tasks, and genuine external blockers honestly.

NON-NEGOTIABLE: Do not stop after reading documents, auditing folders, creating a plan, or generating code snippets. Do not claim functionality works without verification. Do not ask me to repeat information already available in the project or previous requirements.
FINAL ACTION: READ ALL REQUIREMENTS AND SOURCE DOCUMENTS → AUDIT EVERY RELEVANT FOLDER AND FILE → UNDERSTAND THE ENTIRE PRODUCT → RECONCILE ALL CHANGES → CREATE AND MAINTAIN A NEW MASTER PLAN → START ACTUAL CODING → INTEGRATE → BUILD → TEST → FIX → DELIVER THE COMPLETE WORKING FINLY MOBILE APP.
