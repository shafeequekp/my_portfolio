# Muhammed Shafeek — Portfolio

A responsive, modern developer portfolio built with HTML5, Bootstrap 5, and vanilla JavaScript.

**Live site:** https://shafeequekp.github.io/my_portfolio  
**Repo:** https://github.com/shafeequekp/my_portfolio

---

## ✨ Key Feature: Edit Your Portfolio Without Touching Code

You no longer need to modify HTML/JS and push to GitHub every time you want to update your profile, add a project, or change your skills.

All portfolio content lives in **`content.json`**, completely decoupled from the code. A built-in **Admin Panel** (`admin.html`) lets you edit everything from the browser — changes are committed directly to this GitHub repo via the GitHub API, and the live site picks them up automatically.

---

## 📂 Project Structure

```
my_portfolio/
├── index.html              # Main portfolio page (public-facing)
├── admin.html              # Content management admin panel
├── content.json            # All editable portfolio content (profile, skills, experience, projects)
├── README.md               # This file
│
├── css/
│   ├── style.css           # Portfolio styles
│   └── admin.css           # Admin panel styles
│
├── js/
│   ├── data.js             # Loads content.json at runtime (with fallback defaults)
│   ├── scripts.js          # Renders the portfolio from loaded content
│   └── admin.js            # Admin panel logic (GitHub API commits)
│
└── assets/
    ├── profile.jpg         # Profile image
    ├── resume.pdf          # Downloadable CV
    ├── project1.png
    ├── project2.png
    └── project-placeholder.png
```

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/shafeequekp/my_portfolio.git
cd my_portfolio
```

### 2. Run locally

No build step, no dependencies. Just open `index.html` in your browser, or serve it:

```bash
# Using Python 3
python3 -m http.server 8000
# Then visit http://localhost:8000/index.html
```

### 3. Open the admin panel

Visit `admin.html` (locally or on your deployed site) to manage your content:

```
http://localhost:8000/admin.html
```

---

## 🛠️ Managing Content (No-Code Updates)

### One-time setup

1. **Create a GitHub Personal Access Token (PAT):**
   - Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - Click **Generate new token (classic)**
   - Select the **`repo`** scope (or `public_repo` for public repos)
   - Copy the token

2. **Open the admin panel:**
   - Visit `admin.html` on your deployed site
   - Paste your PAT
   - Confirm the repository (`shafeequekp/my_portfolio`) and branch (`main`)
   - Click **Connect & Load Content**

3. **Edit & save:**
   - Update any section — Profile, Skills, Experience, Projects, or Raw JSON
   - Click **Save** — the change is committed to `content.json` on GitHub immediately
   - Open `index.html` (or click **View Portfolio** from the admin topbar) to see your live updates

### What you can edit

| Section | Fields |
|---------|--------|
| **Profile** | Name, title, bio, email, LinkedIn, GitHub, profile image, resume URL |
| **Skills** | Name, proficiency %, category (Backend/Frontend/Tools/Technical), icon class |
| **Experience** | Role, company, period, description |
| **Projects** | Title, description, image, GitHub URL, demo URL, technologies |

> 💡 You can add or remove skills, experience entries, and projects directly from the admin panel — no code changes needed.

---

## 🔐 Security

- Your GitHub PAT is stored **only in your browser** (session/local storage), never sent to any third-party server.
- All writes go directly to your repo via the [GitHub REST API](https://docs.github.com/en/rest).
- Use a token with the minimum required scope (`repo` or `public_repo`).
- Revoke the token anytime from GitHub → Settings → Developer settings → Personal access tokens.

---

## 🌐 Deployment

### GitHub Pages (recommended)

1. Go to your repo **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, select **Deploy from a branch**
3. Select branch `main` and folder `/ (root)`
4. Click **Save**
5. Your site will be live at `https://shafeequekp.github.io/my_portfolio`

The admin panel (`admin.html`) is served automatically as part of the site.

### Other static hosts

This is a pure static site — deploy to Netlify, Vercel, Cloudflare Pages, Firebase Hosting, etc. by pushing the `main` branch.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Markup | HTML5 |
| Styling | CSS3 + Bootstrap 5.3 |
| Icons | Font Awesome 6.4 |
| Logic | Vanilla JavaScript (ES6+) |
| Content | `content.json` (loaded at runtime) |
| Content updates | GitHub REST API (via admin panel) |
| Build | None (zero build step) |

---

## 🎨 Customization

### Styling
- Edit `css/style.css` for portfolio colors, typography, and layout.
- Edit `css/admin.css` for the admin panel appearance.

### Content defaults
`js/data.js` contains embedded fallback defaults used if `content.json` fails to load — useful for offline development.

### Adding new sections
1. Add the HTML section to `index.html`.
2. Add the corresponding field to `content.json`.
3. Add a renderer in `js/scripts.js`.
4. Add an editor tab in `admin.html` and logic in `js/admin.js`.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 📬 Contact

- **Name:** Muhammed Shafeek
- **Email:** shafiequevesala@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/shafeek-kp/
- **GitHub:** https://github.com/shafeequekp

---

*Built with ❤️ and Bootstrap 5.*