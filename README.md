#I want to publish and push this entire existing DHARANETRA project to my GitHub repository.

Current deployed application:

https://dharanetra.freebuff.app/

IMPORTANT:

Do not rebuild the project.

Do not create a new project.

Do not replace the existing application.

I want the CURRENT working DHARANETRA project, including all existing pages, UI/UX, components, backend configuration, assets, and functionality, prepared correctly for publishing to GitHub.

====================================================
STEP 1 — INSPECT THE CURRENT PROJECT
====================================================

Inspect the complete existing project first.

Identify:

- Project structure
- Frontend framework
- Package manager
- Build command
- Environment variables
- Backend configuration
- Authentication configuration
- Static assets
- API integrations
- Any generated files that should not be committed

Do not modify authentication or existing backend functionality unnecessarily.

====================================================
STEP 2 — PREPARE FOR GITHUB
====================================================

Prepare the repository for GitHub.

Create or update a proper .gitignore file.

Make sure the following are NOT committed:

node_modules

.env

.env.local

Environment secrets

API keys

Private authentication keys

Build cache files

Temporary files

OS-specific files

Also ensure that any public environment variable configuration required for deployment is documented without exposing secret values.

====================================================
STEP 3 — README
====================================================

Create or improve README.md.

The README should include:

# DHARANETRA

AI-Powered Landslide Risk Monitoring Platform

Tagline:

Predict • Alert • Respond • Protect

Include sections:

## Overview

## Features

## Technology Stack

## Project Structure

## Installation

## Running Locally

## Environment Variables

## Build

## Deployment

## ML Model Integration

## Geographic Coverage

## Disclaimer

IMPORTANT:

Clearly state that the current ML model coverage is limited to the geographic areas actually supported by the trained model.

Do NOT claim ML prediction coverage for the entire North Eastern Region unless the model actually supports it.

====================================================
STEP 4 — VERIFY BUILD
====================================================

Before preparing the final GitHub version:

1. Install dependencies.
2. Run the type checker.
3. Fix TypeScript errors.
4. Run the production build.
5. Fix build errors.
6. Ensure there are no broken imports.
7. Ensure routes work correctly.
8. Ensure environment variables are not hardcoded.
9. Ensure the application is production-ready.

Do not remove features just to make the build pass.

====================================================
STEP 5 — GIT INITIALIZATION
====================================================

If Git is not already initialized:

Initialize a Git repository.

Create a clean initial commit.

Use a meaningful commit message:

Initial commit: DHARANETRA AI-Powered Landslide Risk Monitoring Platform

If Git is already initialized:

Inspect the existing repository status.

Do not destroy existing commit history.

====================================================
STEP 6 — GITHUB PUBLISHING
====================================================

Prepare the project to connect to my GitHub account.

If GitHub authentication is available in this environment, connect the current repository and push it.

If GitHub authentication requires my action, do not expose credentials or ask me to paste a GitHub password or token into the project.

Instead provide the exact safe Git commands I need to run locally.

The commands should follow this workflow:

1. Create a new GitHub repository named:

dharanetra

2. Add the GitHub repository as the origin.

3. Push the existing project to the main branch.

Example workflow:

git remote add origin YOUR_GITHUB_REPOSITORY_URL

git branch -M main

git push -u origin main

Do not invent my GitHub username or repository URL.

Use placeholders where my GitHub-specific information is required.

====================================================
STEP 7 — DO NOT COMMIT SECRETS
====================================================

Before committing:

Check for:

- API keys
- Tokens
- Passwords
- Private URLs
- JWT private keys
- Authentication secrets
- Environment variables containing secrets

Do not commit them.

Create a .env.example file containing only safe placeholder variable names.

Example:

VITE_API_URL=YOUR_API_URL
VITE_CONVEX_URL=YOUR_CONVEX_URL

Do not copy real secrets into .env.example.

====================================================
STEP 8 — FINAL REPORT
====================================================

After completing the preparation, provide:

1. Repository status
2. Files added
3. Files modified
4. .gitignore contents summary
5. Environment variables that need to be configured
6. Whether the production build succeeds
7. Exact Git commands required to push to GitHub if direct publishing is unavailable

IMPORTANT FINAL RULE:

The GitHub repository must contain the actual current DHARANETRA project that powers:

https://dharanetra.freebuff.app/

Do not create a simplified replacement project.

Do not create a new demo.

Preserve the current UI, map functionality, ML/backend integrations, incident reporting, alerts, and all existing features.
