# LenaDijksma-Portfolio
My personal portfolio website

https://lenadijksma.is-a.dev/

## Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js
- Email: Resend
- Hosting: Render

## Running locally
1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your keys
4. Run `node index.js`

## Environment Variables
RESEND_API_KEY=
### PORT is set automatically by Render, only needed locally
PORT=

### email recaptcha
RECAPTCHA_SECRET=

### =========================
### ADMIN PANEL (/admin)
### =========================

### Password to log into /admin
ADMIN_PASSWORD=

### GitHub Personal Access Token with "Contents: Read and write" permission
### on this repo, used so saved changes are committed and persist across deploys
GITHUB_TOKEN=

### "owner/repo", e.g. LenaDijksma/LenaDijksma-Portfolio
GITHUB_REPO=

### git-calendar
GITHUB_USER=

### Optional, defaults shown
GITHUB_BRANCH=main
GITHUB_FILE_PATH=public/data/projects.json

