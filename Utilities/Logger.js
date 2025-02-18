module.exports = {LogInfo,GetDateTime};
const { Add_To_Server_Queue } = require('../kbServer.js');

const fs = require('fs');
const path = require('path');
const logsDir = path.resolve(__dirname, '..', 'logs'); // Move up two levels to logs directory

// Check and create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true }); // Ensures parent directories are created if needed
}

// Generate log file path
const logFilePath = path.join(logsDir, `log-${GetDateTime()}.json`);
fs.appendFile(logFilePath, `{\n`, (err) => { });

let red = '\x1b[31m';
let green = '\x1b[32m';
let yellow = '\x1b[33m';
let blue = '\x1b[34m';

async function LogInfo(logContents, colours = '\x1b[0m') {
    const log = JSON.stringify({ Time: GetDateTime(), data:logContents }, null, 2);
    try {
        await fs.promises.appendFile(logFilePath, `${log},\n`);
    } catch (err) {
        console.error("Error writing log file:", err);
    }    console.log(colours, log);
    Add_To_Server_Queue(log);
}
function GetDateTime() {
    const currentDate = new Date();
    //DD-MM-YY--HH-MM-SS
    const now = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}--${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
    return now
}

function TestLog(){
    LogInfo("This is a red message", red);
    LogInfo("This is a green message", green);
    LogInfo("This is a yellow message", yellow);
    LogInfo("This is a blue message", blue);
}

//TestLog();