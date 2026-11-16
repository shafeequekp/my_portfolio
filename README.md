# Muhammed Shafeek — Portfolio

A responsive developer portfolio built with HTML5, Bootstrap 5, and vanilla JavaScript.

## ✨ No-code content updates

You no longer need to edit code and push every time you want to update your portfolio. All portfolio content lives in **`content.json`**, and there is a built-in admin panel at **`admin.html`** that lets you edit profile, skills, experience, and projects straight from the browser. Changes are committed directly to this GitHub repo via the GitHub API, and the live site picks them up automatically.

### One-time setup

1. **Create a GitHub Personal Access Token (PAT):**
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic).
   - Generate a new token with the `repo` scope (`public_repo` is enough for public repos).
   - Copy the token.

2. **Open the admin panel:**
   - Visit `admin.html` on your deployed site (or open it locally).
   - Paste your PAT, confirm the repository (`shafeequekp/my_portfolio`) and branch (`main`), then click **Connect & Load Content**.

3. **Edit & save:**
   - Update any section (Profile, Skills, Experience, Projects, or Raw JSON).
   - Click **Save** — the change is committed to `content.json` on GitHub immediately.
   - Open `index.html` (or "View Portfolio" from the admin topbar) to see your live portfolio.

### Where content lives

- **`content.json`** — all editable portfolio content (profile, skills, experience, projects).
- **`js/data.js`** — loads `content.json` at runtime, with embedded defaults as fallback if the file is unavailable.
- **`js/scripts.js`** — renders the portfolio from the loaded content.
- **`admin.html` + `js/admin.js` + `css/admin.css`** — the admin content management UI.

> **Security note:** your PAT is stored only in your browser (session/local storage), never sent to any server. Use a fine-grained/classic token with repo scope only, and revoke it anytime from GitHub settings.

## Tech stack

- HTML5, CSS3 (custom + Bootstrap 5)
- Vanilla JavaScript (no build step)
- Font Awesome icons
- GitHub API for content commits

## Deployment

Push to the `main` branch. If you use GitHub Pages, enable it in Settings → Pages and select the `main` branch (root folder). `admin.html` is served automatically as part of the site.