module.exports = { Add_To_Server_Queue };

var http = require('http');
var fs = require('fs');
var os = require('os');
var path = require('path');

const { Program_Switch, Get_Int_Articles } = require('./Utilities/Migration Tool.js');
const { LogInfo } = require('./Utilities/Logger.js');
const {
    validateSession, createSession, deleteSession,
    verifyPassword, hashPassword,
    createResetToken, consumeResetToken,
    loadUsers, saveUsers
} = require('./Utilities/Auth.js');
const { sendResetEmail } = require('./Utilities/Mailer.js');

var port = 9929;
const localIP = getLocalIP();
const log_to_server_queue = [];

// Routes that do not require a valid session
const PUBLIC_PATHS = new Set(['/login', '/forgot-password', '/reset-password', '/style.css']);

function isPublicPath(url) {
    return PUBLIC_PATHS.has(url.split('?')[0]);
}

function parseCookies(req) {
    const cookies = {};
    (req.headers.cookie || '').split(';').forEach(pair => {
        const idx = pair.indexOf('=');
        if (idx > 0) cookies[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    });
    return cookies;
}

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try { resolve(Object.fromEntries(new URLSearchParams(body))); }
            catch { resolve({}); }
        });
    });
}

function StartServer() {
    const server = http.createServer(async (req, res) => {
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if (req.url !== '/events') {
            LogInfo(`Requested URL: ${req.url} at: ${clientIP}`);
        }

        // ── Auth middleware ──────────────────────────────────────────────────
        if (!isPublicPath(req.url)) {
            const token = parseCookies(req).session;
            const email = validateSession(token);
            if (!email) {
                if (req.method === 'GET') {
                    res.writeHead(302, { Location: '/login' });
                } else {
                    // POST/fetch calls get 401 so the frontend can redirect
                    res.writeHead(401, { 'Content-Type': 'text/plain' });
                    res.write('Unauthorized');
                }
                res.end();
                return;
            }
        }
        // ────────────────────────────────────────────────────────────────────

        if (req.method === 'GET') {
            if (req.url === '/exportIntercom') {
                LogInfo("Exporting Intercom articles");
                Get_Int_Articles().then(articles => {
                    const json = JSON.stringify(articles, null, 2);
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Content-Disposition': 'attachment; filename="intercom-articles.json"'
                    });
                    res.end(json);
                }).catch(err => {
                    LogInfo(`Export error: ${err}`, 'red');
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Export failed');
                });
            } else if (req.url.startsWith('/login')) {
                serveStaticFile('./login.html', 'text/html', res);
            } else if (req.url.startsWith('/forgot-password')) {
                serveStaticFile('./forgot-password.html', 'text/html', res);
            } else if (req.url.startsWith('/reset-password')) {
                serveStaticFile('./reset-password.html', 'text/html', res);
            } else {
                const filePath = `.${req.url === '/' ? '/index.html' : req.url}`;
                serveStaticFile(filePath, getContentType(filePath), res);
            }

        } else if (req.method === 'POST') {

            if (req.url === '/login') {
                const { email, password } = await parseBody(req);
                const users = loadUsers();
                const user = users.find(u => u.email === (email || '').toLowerCase().trim());
                const valid = user && await verifyPassword(password || '', user.hash, user.salt);
                if (!valid) {
                    res.writeHead(302, { Location: '/login?error=1' });
                    res.end();
                    return;
                }
                const token = createSession(user.email);
                res.writeHead(302, {
                    Location: '/',
                    'Set-Cookie': `session=${token}; HttpOnly; SameSite=Strict; Max-Age=86400; Path=/`
                });
                res.end();

            } else if (req.url === '/logout') {
                const token = parseCookies(req).session;
                if (token) deleteSession(token);
                res.writeHead(302, {
                    Location: '/login',
                    'Set-Cookie': 'session=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/'
                });
                res.end();

            } else if (req.url === '/forgot-password') {
                const { email } = await parseBody(req);
                const users = loadUsers();
                const user = users.find(u => u.email === (email || '').toLowerCase().trim());
                if (user) {
                    const resetToken = createResetToken(user.email);
                    const resetLink = `http://${localIP}:${port}/reset-password?token=${resetToken}`;
                    try {
                        await sendResetEmail(user.email, resetLink);
                        LogInfo(`Password reset email sent to ${user.email}`);
                    } catch (err) {
                        LogInfo(`Failed to send reset email: ${err}`, 'red');
                    }
                }
                // Always return success — prevents email enumeration
                res.writeHead(302, { Location: '/forgot-password?sent=1' });
                res.end();

            } else if (req.url === '/reset-password') {
                const { token, password } = await parseBody(req);
                const email = consumeResetToken(token);
                if (!email) {
                    res.writeHead(302, { Location: '/reset-password?error=1' });
                    res.end();
                    return;
                }
                const users = loadUsers();
                const idx = users.findIndex(u => u.email === email);
                if (idx === -1) {
                    res.writeHead(302, { Location: '/reset-password?error=1' });
                    res.end();
                    return;
                }
                const { hash, salt } = await hashPassword(password);
                users[idx].hash = hash;
                users[idx].salt = salt;
                saveUsers(users);
                LogInfo(`Password reset for ${email}`);
                res.writeHead(302, { Location: '/login?reset=1' });
                res.end();

            } else if (req.url === '/update&Create') {
                LogInfo("Updating and Creating new articles");
                Program_Switch(1).then(result => {
                    if (result) {
                        LogInfo("Update & Create operation completed.");
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('done');
                    }
                });
            } else if (req.url === '/updateOnly') {
                LogInfo("Updating all articles");
                Program_Switch(2).then(result => {
                    if (result) {
                        LogInfo("Update operation completed.");
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('done');
                    }
                });
            } else if (req.url === '/createOnly') {
                LogInfo("Creating new articles");
                Program_Switch(3).then(result => {
                    if (result) {
                        LogInfo("Create operation completed.");
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('done');
                    }
                });
            } else if (req.url.includes('/updateSpecific')) {
                const inputValue = req.url.split('/')[2];
                LogInfo(`Updating article ${inputValue}`);
                Program_Switch(2, inputValue).then(result => {
                    if (result) {
                        LogInfo("Update Specific operation completed.");
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('done');
                    }
                });
            } else if (req.url.includes('/createSpecific')) {
                const inputValue = req.url.split('/')[2];
                LogInfo(`Creating article ${inputValue}`);
                Program_Switch(3, inputValue).then(result => {
                    if (result) {
                        LogInfo("Create Specific operation completed.");
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('done');
                    }
                });
            } else if (req.url === '/events') {
                if (log_to_server_queue.length > 0) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.write(log_to_server_queue.shift());
                }
                res.end();
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
            }
        }
    });

    server.listen(port, localIP, () => {
        LogInfo(`Server on http://${localIP}:${port}`);
    });

    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            let randomValue = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000;
            LogInfo(`Port ${port} is in use, switching to ${randomValue}`);
            port = randomValue;
            StartServer();
        } else {
            LogInfo(e.code, 'red');
        }
    });
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (let name in interfaces) {
        for (let iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal && name !== 'NordLynx') {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

function getContentType(filePath) {
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.mp4': 'video/mp4',
    };
    return mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function serveStaticFile(filePath, contentType, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`<h1>500 Internal Server Error</h1><p>${err.message}</p>`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

function Add_To_Server_Queue(val) {
    log_to_server_queue.push(val);
}

StartServer();
