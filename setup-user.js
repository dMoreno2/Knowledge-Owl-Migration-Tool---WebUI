// Run with: node setup-user.js
// Creates or updates a user in users.json

const { hashPassword, loadUsers, saveUsers } = require('./Utilities/Auth.js');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

async function main() {
    const email = (await ask('Email: ')).trim().toLowerCase();
    if (!email.includes('@')) {
        console.error('Invalid email address.');
        process.exit(1);
    }

    const password = await ask('Password: ');
    if (password.length < 8) {
        console.error('Password must be at least 8 characters.');
        process.exit(1);
    }

    const users = loadUsers();
    const existingIndex = users.findIndex(u => u.email === email);
    const { hash, salt } = await hashPassword(password);

    if (existingIndex >= 0) {
        users[existingIndex].hash = hash;
        users[existingIndex].salt = salt;
        console.log(`Password updated for ${email}`);
    } else {
        users.push({ email, hash, salt });
        console.log(`User created: ${email}`);
    }

    saveUsers(users);
    rl.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
