/* ============================================================
   Portfolio Admin CMS
   Edits content.json directly on GitHub via the REST API.
   No server, no build step — just your GitHub token + this page.
   ============================================================ */
(function () {
  'use strict';

  // ---------------- Configuration ----------------
  const DEFAULT_CONFIG = {
    owner: 'shafeequekp',
    repo: 'my_portfolio',
    branch: 'main'
  };
  const FILE_PATH = 'content.json';

  const STORAGE_TOKEN = 'portfolio_admin_token';
  const STORAGE_REMEMBER = 'portfolio_admin_remember';
  const STORAGE_CONFIG = 'portfolio_admin_config';

  // ---------------- DOM shortcuts ----------------
  const $ = (id) => document.getElementById(id);
  const loginScreen = $('login-screen');
  const dashboard = $('dashboard');

  // ---------------- State ----------------
  let token = '';
  let cfg = { ...DEFAULT_CONFIG };
  let fileSha = null;
  let content = null; // parsed content.json
  let repos = []; // fetched GitHub repositories for the dropdown

  // ---------------- Auth helpers ----------------
  function loadSavedState() {
    token = sessionStorage.getItem(STORAGE_TOKEN) || localStorage.getItem(STORAGE_REMEMBER) || '';
    const raw = localStorage.getItem(STORAGE_CONFIG);
    if (raw) {
      try { cfg = { ...DEFAULT_CONFIG, ...JSON.parse(raw) }; } catch { /* keep defaults */ }
    }
    if ($('config-owner')) $('config-owner').value = cfg.owner;
    if ($('config-repo')) $('config-repo').value = cfg.repo;
    if ($('config-branch')) $('config-branch').value = cfg.branch;
    if ($('remember')) $('remember').checked = !!localStorage.getItem(STORAGE_REMEMBER);
  }

  function persistToken(remember) {
    if (remember) {
      localStorage.setItem(STORAGE_REMEMBER, token);
      sessionStorage.setItem(STORAGE_TOKEN, token);
    } else {
      sessionStorage.setItem(STORAGE_TOKEN, token);
      localStorage.removeItem(STORAGE_REMEMBER);
    }
    cfg = {
      owner: $('config-owner').value.trim(),
      repo: $('config-repo').value.trim(),
      branch: $('config-branch').value.trim()
    };
    localStorage.setItem(STORAGE_CONFIG, JSON.stringify(cfg));
  }

  function clearState() {
    token = '';
    fileSha = null;
    content = null;
    sessionStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_REMEMBER);
  }

  function showAuth() {
    loginScreen.classList.remove('d-none');
    dashboard.classList.remove('visible');
    dashboard.style.display = 'none';
  }

  function showDashboard() {
    loginScreen.classList.add('d-none');
    dashboard.classList.add('visible');
    dashboard.style.display = 'flex';
    if ($('repo-display')) $('repo-display').textContent = `${cfg.owner}/${cfg.repo} @ ${cfg.branch}`;
  }

  // ---------------- GitHub API ----------------
  function authHeaders() {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  async function ghRequest(apiPath, method = 'GET', body = null) {
    const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}${apiPath}`;
    const opts = {
      method,
      headers: { ...authHeaders(), 'Content-Type': 'application/json' }
    };
    if (body !== null) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    let payload = {};
    try { payload = await res.json(); } catch { /* ignore */ }
    if (!res.ok) {
      throw new Error(payload.message || `GitHub API error (${res.status})`);
    }
    return payload;
  }

  function b64EncodeUtf8(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64DecodeUtf8(base64) {
    return decodeURIComponent(escape(atob(base64)));
  }

  async function loadContentFromGitHub() {
    const file = await ghRequest(`/contents/${FILE_PATH}?ref=${cfg.branch}`);
    fileSha = file.sha;
    content = JSON.parse(b64DecodeUtf8(file.content));
    return content;
  }

  async function commitContent(updated, message) {
    // Re-fetch latest SHA so concurrent edits don't clobber each other
    const current = await ghRequest(`/contents/${FILE_PATH}?ref=${cfg.branch}`);
    const encoded = b64EncodeUtf8(JSON.stringify(updated, null, 2));
    const result = await ghRequest(`/contents/${FILE_PATH}`, 'PUT', {
      message,
      content: encoded,
      branch: cfg.branch,
      sha: current.sha
    });
    fileSha = (result && result.content && result.content.sha) || current.sha;
    content = updated;
    return result;
  }

  // ---------------- UI helpers ----------------
  function showToast(message, type = 'success') {
    const container = $('toast-container');
    const el = document.createElement('div');
    const kind = type === 'error' ? 'danger' : 'success';
    el.className = `toast align-items-center text-bg-${kind} border-0 shadow`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <div class="d-flex w-100">
        <div class="toast-body">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;
    container.appendChild(el);
    const bs = new bootstrap.Toast(el, { autohide: true, delay: 4000 });
    bs.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  }

  function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function setBtnLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
    } else {
      btn.disabled = false;
      if (btn.dataset.origHtml) {
        btn.innerHTML = btn.dataset.origHtml;
        delete btn.dataset.origHtml;
      }
    }
  }

  function fieldVal(name, root) {
    const el = root.querySelector(`[data-field="${escapeCss(name)}"]`);
    return el ? el.value : '';
  }

  // CSS.escape polyfill for data-field selectors containing brackets/dots
  function escapeCss(sel) {
    if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(sel);
    return sel.replace(/[!"#$%&'()*+,./:;<=>?@[\]^`{|}~]/g, '\\$&');
  }

  // ---------------- Field builders ----------------
  function textInput(name, value, placeholder = '') {
    return `<div class="field-group">
      <label class="field-label">${escapeHtml(name)}</label>
      <input type="text" name="${escapeHtml(name)}" value="${escapeHtml(value ?? '')}"
             placeholder="${escapeHtml(placeholder)}" class="form-control form-control-sm"
             data-field="${escapeHtml(name)}">
    </div>`;
  }
  function urlInput(name, value) {
    return `<div class="field-group">
      <label class="field-label">${escapeHtml(name)}</label>
      <input type="url" name="${escapeHtml(name)}" value="${escapeHtml(value ?? '')}"
             placeholder="https://..." class="form-control form-control-sm"
             data-field="${escapeHtml(name)}">
    </div>`;
  }
  function emailInput(name, value) {
    return `<div class="field-group">
      <label class="field-label">${escapeHtml(name)}</label>
      <input type="email" name="${escapeHtml(name)}" value="${escapeHtml(value ?? '')}"
             class="form-control form-control-sm" data-field="${escapeHtml(name)}">
    </div>`;
  }
  function textareaField(name, value, rows = 3) {
    return `<div class="field-group form-full">
      <label class="field-label">${escapeHtml(name)}</label>
      <textarea name="${escapeHtml(name)}" rows="${rows}" class="form-control form-control-sm"
                data-field="${escapeHtml(name)}">${escapeHtml(value ?? '')}</textarea>
    </div>`;
  }
  function selectField(name, value, options) {
    const opts = options.map(o => `<option value="${escapeHtml(o)}" ${value === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
    return `<div class="field-group">
      <label class="field-label">${escapeHtml(name)}</label>
      <select name="${escapeHtml(name)}" class="form-select form-select-sm" data-field="${escapeHtml(name)}">
        ${opts}
      </select>
    </div>`;
  }

  // ---------------- Section renderers ----------------
  function renderProfile(d) {
    const p = d.profile || {};
    return `
      <div class="form-grid">
        ${textInput('Name', p.name, 'e.g. Muhammed Shafeek')}
        ${textInput('Title', p.title, 'e.g. Python Developer')}
        ${emailInput('Email', p.email)}
        ${urlInput('LinkedIn', p.linkedin)}
        ${urlInput('GitHub', p.github)}
        ${textInput('Profile image', p.profileImage, 'assets/profile.jpg')}
        ${textInput('Resume URL', p.resumeUrl, 'assets/resume.pdf')}
        ${textareaField('Bio', p.bio, 4)}
      </div>
      <div class="save-actions">
        <button class="btn btn-primary" onclick="app.saveSection('profile')"><i class="fas fa-save me-1"></i> Save Profile</button>
        <span id="save-status-profile" class="text-small text-muted ms-2"></span>
      </div>
    `;
  }

  function renderSkills(d) {
    const skills = d.skills || [];
    const categories = ['Backend', 'Frontend', 'Tools', 'Technical'];
    const rows = skills.map((s, i) => `
      <div class="repeater-item skills-row" data-index="${i}">
        <div class="field-group">
          <label class="field-label">Name</label>
          <input type="text" value="${escapeHtml(s.name ?? '')}" placeholder="e.g. Python" class="form-control form-control-sm" data-field="skills[${i}].name">
        </div>
        <div class="field-group">
          <label class="field-label">%</label>
          <input type="number" min="0" max="100" value="${escapeHtml(s.proficiency ?? '')}" class="form-control form-control-sm" data-field="skills[${i}].proficiency">
        </div>
        <div class="field-group">${selectField(`skills[${i}].category`, s.category, categories)}</div>
        <div class="field-group">
          <label class="field-label">Icon class</label>
          <input type="text" value="${escapeHtml(s.icon ?? '')}" placeholder="fab fa-python" class="form-control form-control-sm" data-field="skills[${i}].icon">
        </div>
        <button type="button" class="btn-remove" onclick="app.removeRow('skills', ${i})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    `).join('');
    return `
      <div class="repeater">${rows || '<div class="empty-note">No skills yet.</div>'}</div>
      <button type="button" class="btn-add" onclick="app.addRow('skills')" title="Add skill">+</button>
      <div class="save-actions mt-3">
        <button class="btn btn-primary" onclick="app.saveSection('skills')"><i class="fas fa-save me-1"></i> Save Skills</button>
      </div>
    `;
  }

  function renderExperience(d) {
    const exps = d.experience || [];
    const rows = exps.map((e, i) => `
      <div class="repeater-item" data-index="${i}">
        <div class="field-group">
          <label class="field-label">Role</label>
          <input type="text" value="${escapeHtml(e.role ?? '')}" class="form-control form-control-sm" data-field="experience[${i}].role">
        </div>
        <div class="field-group">
          <label class="field-label">Company</label>
          <input type="text" value="${escapeHtml(e.company ?? '')}" class="form-control form-control-sm" data-field="experience[${i}].company">
        </div>
        <div class="field-group">
          <label class="field-label">Period</label>
          <input type="text" value="${escapeHtml(e.period ?? '')}" placeholder="e.g. May 2022 - Present" class="form-control form-control-sm" data-field="experience[${i}].period">
        </div>
        <div class="field-group" style="grid-column: 1 / -1;">
          <label class="field-label">Description</label>
          <textarea rows="3" class="form-control form-control-sm" data-field="experience[${i}].description">${escapeHtml(e.description ?? '')}</textarea>
        </div>
        <button type="button" class="btn-remove" onclick="app.removeRow('experience', ${i})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    `).join('');
    return `
      <div class="repeater">${rows || '<div class="empty-note">No experience yet.</div>'}</div>
      <button type="button" class="btn-add" onclick="app.addRow('experience')" title="Add experience">+</button>
      <div class="save-actions mt-3">
        <button class="btn btn-primary" onclick="app.saveSection('experience')"><i class="fas fa-save me-1"></i> Save Experience</button>
      </div>
    `;
  }

  function renderProjects(d) {
    const projs = d.projects || [];
    const rows = projs.map((p, i) => `
      <div class="repeater-item" data-index="${i}">
        <div class="field-group">
          <label class="field-label">Title</label>
          <input type="text" value="${escapeHtml(p.title ?? '')}" class="form-control form-control-sm" data-field="projects[${i}].title">
        </div>
        <div class="field-group" style="grid-column: 1 / -1;">
          <label class="field-label">Description</label>
          <textarea rows="3" class="form-control form-control-sm" data-field="projects[${i}].description">${escapeHtml(p.description ?? '')}</textarea>
        </div>
        <div class="field-group">
          <label class="field-label">Image</label>
          <input type="text" value="${escapeHtml(p.image ?? '')}" placeholder="assets/project1.png" class="form-control form-control-sm" data-field="projects[${i}].image">
        </div>
        <div class="field-group">
          <label class="field-label">GitHub URL</label>
          <input type="url" value="${escapeHtml(p.github ?? '')}" placeholder="https://..." class="form-control form-control-sm" data-field="projects[${i}].github">
        </div>
        <div class="field-group">
          <label class="field-label">Demo URL</label>
          <input type="url" value="${escapeHtml(p.demo ?? '')}" placeholder="https://..." class="form-control form-control-sm" data-field="projects[${i}].demo">
        </div>
        <div class="field-group">
          <label class="field-label">Technologies</label>
          <input type="text" value="${escapeHtml(p.technologies ?? '')}" placeholder="e.g. Python, Django" class="form-control form-control-sm" data-field="projects[${i}].technologies">
        </div>
        <button type="button" class="btn-remove" onclick="app.removeRow('projects', ${i})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    `).join('');
    return `
      <div class="repeater">${rows || '<div class="empty-note">No projects yet.</div>'}</div>
      <button type="button" class="btn-add" onclick="app.addRow('projects')" title="Add project">+</button>
      <div class="save-actions mt-3">
        <button class="btn btn-primary" onclick="app.saveSection('projects')"><i class="fas fa-save me-1"></i> Save Projects</button>
      </div>
    `;
  }

  function renderRaw(d) {
    return `<div class="json-wrap">
      <textarea class="json-textarea" id="raw-json">${JSON.stringify(d, null, 2)}</textarea>
      <div class="save-actions mt-3">
        <button class="btn btn-primary" id="btn-save-raw" onclick="app.saveRaw()"><i class="fas fa-save me-1"></i> Save Raw JSON</button>
        <button class="btn btn-outline-secondary ms-2" onclick="app.loadRaw()"><i class="fas fa-refresh me-1"></i> Reload from Repo</button>
      </div>
    </div>`;
  }

  // ---------------- Section switching ----------------
  window.app = {
    showSection(id) {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
      $('panel-' + id).classList.add('active');
      const link = document.querySelector('.sidebar a[data-section="' + id + '"]');
      if (link) link.classList.add('active');
    },

    async init() {
      loadSavedState();
      if (token) {
        try {
          await loadContentFromGitHub();
          this.renderAll();
          showDashboard();
        } catch (err) {
          showToast('Auth failed: ' + err.message, 'error');
          clearState();
          showAuth();
        }
      } else {
        showAuth();
      }
    },

    async connect() {
      const btn = $('btn-connect');
      setBtnLoading(btn, true);
      try {
        token = $('pat').value.trim();
        if (!token) throw new Error('Please enter your GitHub Personal Access Token.');
        persistToken($('remember').checked);
        await loadContentFromGitHub();
        this.renderAll();
        showDashboard();
        showToast('Connected to GitHub. Content loaded from ' + FILE_PATH, 'success');
      } catch (err) {
        showToast(err.message, 'error');
        clearState();
      } finally {
        setBtnLoading(btn, false);
      }
    },

    async fetchRepos() {
      token = $('pat').value.trim();
      if (!token) {
        showToast('Please enter your GitHub PAT first', 'error');
        return;
      }
      const btn = $('btn-fetch-repos');
      const origHtml = btn.innerHTML;
      setBtnLoading(btn, true);
      try {
        const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: authHeaders()
        });
        if (!res.ok) throw new Error(`GitHub API error (${res.status})`);
        repos = await res.json();

        const sel = $('repo-select');
        sel.innerHTML = '<option value="">Select a repository…</option>';
        repos.forEach(r => {
          const option = document.createElement('option');
          option.value = r.full_name; // "owner/repo"
          option.textContent = r.full_name + (r.private ? ' 🔒' : '');
          sel.appendChild(option);
        });

        if (repos.length === 0) {
          showToast('No repositories found for this account', 'error');
        } else {
          showToast(`Found ${repos.length} repositories`, 'success');
        }
      } catch (err) {
        showToast('Failed to fetch repositories: ' + err.message, 'error');
      } finally {
        setBtnLoading(btn, false);
      }
    },

    logout() {
      clearState();
      showAuth();
      showToast('Logged out', 'success');
    },

    async refresh() {
      try {
        await loadContentFromGitHub();
        this.renderAll();
        showToast('Refreshed from GitHub repo', 'success');
      } catch (err) {
        showToast('Refresh failed: ' + err.message, 'error');
      }
    },

    renderAll() {
      if (!content) return;
      $('editor-profile').innerHTML = renderProfile(content);
      $('editor-skills').innerHTML = renderSkills(content);
      $('editor-experience').innerHTML = renderExperience(content);
      $('editor-projects').innerHTML = renderProjects(content);
      $('editor-raw').innerHTML = renderRaw(content);
      if ($('raw-json')) $('raw-json').value = JSON.stringify(content, null, 2);
    },

    addRow(section) {
      if (!content) return;
      const arr = content[section] || [];
      arr.push({});
      this.renderAll();
    },

    removeRow(section, index) {
      if (!content) return;
      content[section].splice(index, 1);
      this.renderAll();
    },

    collectProfile() {
      const f = $('editor-profile');
      return {
        name: fieldVal('Name', f),
        title: fieldVal('Title', f),
        bio: fieldVal('Bio', f),
        email: fieldVal('Email', f),
        linkedin: fieldVal('LinkedIn', f),
        github: fieldVal('GitHub', f),
        profileImage: fieldVal('Profile image', f),
        resumeUrl: fieldVal('Resume URL', f)
      };
    },

    collectArray(section, fields) {
      const panel = $('editor-' + section);
      const rows = panel.querySelectorAll('.repeater-item');
      const arr = [];
      rows.forEach((row, i) => {
        const item = {};
        fields.forEach((field) => {
          const el = row.querySelector(`[data-field="${section}[${i}].${field}"]`);
          item[field] = el ? el.value : '';
        });
        arr.push(item);
      });
      return arr;
    },

    async saveSection(section) {
      if (!content) return;
      const btn = document.querySelector(`button[onclick="app.saveSection('${section}')"]`);
      setBtnLoading(btn, true);
      try {
        const updated = JSON.parse(JSON.stringify(content)); // deep copy
        if (section === 'profile') {
          updated.profile = this.collectProfile();
          if (!updated.profile.name || !updated.profile.title) throw new Error('Name and Title are required.');
        } else if (section === 'skills') {
          updated.skills = this.collectArray('skills', ['name', 'proficiency', 'category', 'icon']);
        } else if (section === 'experience') {
          updated.experience = this.collectArray('experience', ['role', 'company', 'period', 'description']);
        } else if (section === 'projects') {
          updated.projects = this.collectArray('projects', ['title', 'description', 'image', 'github', 'demo', 'technologies']);
        }
        await commitContent(updated, `chore(portfolio): update ${section} via admin panel`);
        this.renderAll();
        showToast(`${section} saved and committed to ${cfg.repo}`, 'success');
      } catch (err) {
        showToast('Save failed: ' + err.message, 'error');
      } finally {
        setBtnLoading(btn, false);
      }
    },

    async saveRaw() {
      if (!content) return;
      const btn = $('btn-save-raw');
      setBtnLoading(btn, true);
      try {
        const updated = JSON.parse($('raw-json').value);
        await commitContent(updated, 'chore(portfolio): update raw content.json via admin panel');
        this.renderAll();
        showToast('Raw JSON saved and committed', 'success');
      } catch (err) {
        showToast('Invalid JSON or save failed: ' + err.message, 'error');
      } finally {
        setBtnLoading(btn, false);
      }
    },

    loadRaw() {
      if (content) $('raw-json').value = JSON.stringify(content, null, 2);
    }
  };

  // ---------------- Boot ----------------
  document.addEventListener('DOMContentLoaded', () => {
    if ($('btn-connect')) $('btn-connect').addEventListener('click', () => window.app.connect());
    if ($('btn-logout')) $('btn-logout').addEventListener('click', () => window.app.logout());
    if ($('btn-refresh')) $('btn-refresh').addEventListener('click', () => window.app.refresh());
    if ($('pat')) $('pat').addEventListener('keypress', (e) => { if (e.key === 'Enter') window.app.connect(); });
    if ($('repo-select')) {
      $('repo-select').addEventListener('change', (e) => {
        const full = e.target.value;
        if (!full) return;
        const parts = full.split('/');
        if (parts.length === 2) {
          $('config-owner').value = parts[0];
          $('config-repo').value = parts[1];
          cfg.owner = parts[0];
          cfg.repo = parts[1];
        }
      });
    }
    window.app.init();
  });
})();
