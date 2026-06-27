module.exports = {
    hashPassword, verifyPassword,
    createSession, validateSession, deleteSession,
    createResetToken, consumeResetToken,
    loadUsers, saveUsers
};

const crypto = require('crypto');
const { promisify } = require('util');
const fs = require('fs');

const scryptAsync = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const RESET_TOKEN_TIMEOUT_MS = 60 * 60 * 1000;
const USERS_FILE = 'users.json';

// In-memory stores — sessions are lost on restart (by design)
const sessions = new Map();
const resetTokens = new Map();

function loadUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
    return { hash: derivedKey.toString('hex'), salt };
}

async function verifyPassword(password, storedHash, salt) {
    const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), derivedKey);
}

// Token is generated server-side using crypto.randomBytes — client only ever sees the
// opaque string via an HttpOnly cookie and cannot influence or forge it.
function createSession(email) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { email, expires: Date.now() + SESSION_TIMEOUT_MS });
    return token;
}

function validateSession(token) {
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expires) {
        sessions.delete(token);
        return null;
    }
    session.expires = Date.now() + SESSION_TIMEOUT_MS; // sliding window — activity resets the clock
    return session.email;
}

function deleteSession(token) {
    sessions.delete(token);
}

function createResetToken(email) {
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, { email, expires: Date.now() + RESET_TOKEN_TIMEOUT_MS });
    return token;
}

function consumeResetToken(token) {
    if (!token) return null;
    const entry = resetTokens.get(token);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
        resetTokens.delete(token);
        return null;
    }
    resetTokens.delete(token); // one-time use
    return entry.email;
}
