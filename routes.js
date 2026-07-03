const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Resend } = require('resend');

const router = express.Router();

const resend =
    new Resend(process.env.RESEND_API_KEY);

const PROJECTS_PATH = path.join(__dirname, 'public', 'data', 'projects.json');
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

// =========================
// ADMIN AUTH HELPERS
// =========================

function parseCookies(req) {
    const header = req.headers.cookie;
    const cookies = {};
    if (!header) return cookies;
    header.split(';').forEach(pair => {
        const idx = pair.indexOf('=');
        if (idx === -1) return;
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        cookies[key] = decodeURIComponent(val);
    });
    return cookies;
}

function createSessionToken() {
    const secret = process.env.ADMIN_PASSWORD;
    const expiry = Date.now() + SESSION_MAX_AGE_MS;
    const hmac = crypto.createHmac('sha256', secret).update(String(expiry)).digest('hex');
    return `${expiry}.${hmac}`;
}

function verifySessionToken(token) {
    if (!token || !process.env.ADMIN_PASSWORD) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [expiryStr, hmac] = parts;
    const expiry = Number(expiryStr);
    if (!expiry || Date.now() > expiry) return false;

    const secret = process.env.ADMIN_PASSWORD;
    const expected = crypto.createHmac('sha256', secret).update(expiryStr).digest('hex');

    const a = Buffer.from(hmac);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function setSessionCookie(res, token) {
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
        'Set-Cookie',
        `admin_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE_MS / 1000}; SameSite=Strict${isProd ? '; Secure' : ''}`
    );
}

function clearSessionCookie(res) {
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
        'Set-Cookie',
        `admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${isProd ? '; Secure' : ''}`
    );
}

function requireAuth(req, res, next) {
    const cookies = parseCookies(req);
    if (verifySessionToken(cookies.admin_session)) return next();
    return res.status(401).json({ error: 'Unauthorized' });
}

// Very small in-memory brute-force guard (resets on restart, fine for a personal site)
const loginAttempts = new Map(); // ip -> { count, firstAttempt }
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;

function isLockedOut(ip) {
    const entry = loginAttempts.get(ip);
    if (!entry) return false;
    if (Date.now() - entry.firstAttempt > LOGIN_WINDOW_MS) {
        loginAttempts.delete(ip);
        return false;
    }
    return entry.count >= LOGIN_MAX_ATTEMPTS;
}

function recordFailedAttempt(ip) {
    const entry = loginAttempts.get(ip);
    if (!entry || Date.now() - entry.firstAttempt > LOGIN_WINDOW_MS) {
        loginAttempts.set(ip, { count: 1, firstAttempt: Date.now() });
    } else {
        entry.count += 1;
    }
}

function clearAttempts(ip) {
    loginAttempts.delete(ip);
}

// =========================
// GITHUB COMMIT HELPER
// =========================

async function commitProjectsToGitHub(projects) {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO; // "owner/repo"
    const branch = process.env.GITHUB_BRANCH || 'main';
    const filePath = process.env.GITHUB_FILE_PATH || 'public/data/projects.json';

    if (!token || !repo) {
        throw new Error('GitHub integration is not configured (missing GITHUB_TOKEN or GITHUB_REPO)');
    }

    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    const headers = {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'lenadijksma-portfolio-admin',
        Accept: 'application/vnd.github+json'
    };

    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (!getRes.ok) {
        throw new Error(`Could not read current file from GitHub (${getRes.status})`);
    }
    const current = await getRes.json();

    const content = Buffer
        .from(JSON.stringify(projects, null, 4) + '\n')
        .toString('base64');

    const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'Update projects.json via admin panel',
            content,
            sha: current.sha,
            branch
        })
    });

    if (!putRes.ok) {
        const errBody = await putRes.text();
        throw new Error(`GitHub commit failed (${putRes.status}): ${errBody}`);
    }

    return putRes.json();
}

// =========================
// PAGES
// =========================

router.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'index.html')
    );
});

router.get('/autonote', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'autonote.html')
    );
});

router.get('/netscan', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'netscan.html')
    );
});

router.get('/placeholder', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'placeholder.html')
    );
});

router.get('/admin43AE39', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'admin.html')
    );
});

// =========================
// ADMIN API
// =========================

router.post('/admin/api/login', (req, res) => {

    if (!process.env.ADMIN_PASSWORD) {
        return res.status(500).json({ error: 'Admin login is not configured on the server' });
    }

    const ip = req.ip;

    if (isLockedOut(ip)) {
        return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }

    const { password } = req.body || {};
    const supplied = Buffer.from(String(password || ''));
    const expected = Buffer.from(process.env.ADMIN_PASSWORD);

    const match = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);

    if (!match) {
        recordFailedAttempt(ip);
        return res.status(401).json({ error: 'Incorrect password' });
    }

    clearAttempts(ip);
    setSessionCookie(res, createSessionToken());
    res.json({ success: true });
});

router.post('/admin/api/logout', (req, res) => {
    clearSessionCookie(res);
    res.json({ success: true });
});

router.get('/admin/api/session', requireAuth, (req, res) => {
    res.json({ authenticated: true });
});

router.get('/admin/api/projects', requireAuth, async (req, res) => {
    try {
        const raw = await fs.promises.readFile(PROJECTS_PATH, 'utf-8');
        res.json(JSON.parse(raw));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to read projects.json' });
    }
});

router.post('/admin/api/projects', requireAuth, async (req, res) => {

    const projects = req.body;

    if (!Array.isArray(projects)) {
        return res.status(400).json({ error: 'Expected a JSON array of projects' });
    }

    for (const project of projects) {
        if (typeof project.title !== 'string' || typeof project.name !== 'string') {
            return res.status(400).json({ error: 'Every project needs at least a title and a name' });
        }
    }

    try {
        await fs.promises.writeFile(
            PROJECTS_PATH,
            JSON.stringify(projects, null, 4) + '\n'
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to save projects.json on the server' });
    }

    try {
        await commitProjectsToGitHub(projects);
        res.json({ success: true, committed: true });
    } catch (error) {
        console.error(error);
        res.json({
            success: true,
            committed: false,
            warning: `Saved on the live server, but the GitHub commit failed: ${error.message}`
        });
    }
});

// =========================
// SEND EMAIL
// =========================

router.post('/send-email', async (req, res) => {

    try {

        const {
            name,
            email,
            subject,
            message,
            company
        } = req.body;

        // HONEYPOT SPAM CHECK

        if (company) {
            return res
                .status(400)
                .json({
                    error: 'Spam detected'
                });
        }

        const data =
            await resend.emails.send({

                from:
                    'Portfolio Contact <onboarding@resend.dev>',

                to:
                    'lenadijksma08@gmail.com',

                subject:
                    `[Portfolio] ${subject}`,

                html: `
                    <h2>New Portfolio Contact</h2>

                    <p>
                        <strong>Name:</strong>
                        ${name}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${email}
                    </p>

                    <p>
                        <strong>Subject:</strong>
                        ${subject}
                    </p>

                    <p>
                        <strong>Message:</strong>
                    </p>

                    <p>
                        ${message}
                    </p>
                `
            });

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Failed to send email'
        });
    }
});

// =========================
// 404 (must stay last)
// =========================

router.use((req, res) => {
    res.status(404).sendFile(
        path.join(__dirname, 'public', '404.html')
    );
});

module.exports = router;