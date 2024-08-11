var http = require('http');
var fs = require('fs');
var os = require('os');
var path = require('path');
const { Program_Switch } = require('./Knowledge Owl Migration Tool.js');

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

const logFilePath = path.join(path.join(__dirname, 'logs'), `log-${GetDateTime()}.json`);

var port = 5555;
var log_to_file_queue = [];
var log_to_server_queue = [];

const localIP = getLocalIP();
const originalConsoleLog = console.log;

console.log = function (message) {
  // Call the original console.log function
  originalConsoleLog.apply(console, arguments);
  log_to_server_queue.push(Array.from(arguments).join(' '));
};

function StartServer() {
  const server = http.createServer((req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    Output(`Requested URL: ${req.url} at: ${clientIP}`);

    if (req.method === 'GET') {
      const filePath = `.${req.url === '/' ? '/index.html' : req.url}`;
      const contentType = getContentType(filePath);
      serveStaticFile(filePath, contentType, res);
    }

    else if (req.method === 'POST') {
      if (req.url === '/update&Create') {
        Output("Updating and Creating new articles");
        Program_Switch(443);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write("some test text");
        res.end();
      }
      else if (req.url === '/updateOnly') {
        Output("Updating all articles");
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write("some test text");
        res.end();
      }
      else if (req.url === '/createOnly') {
        Output("Creating new articles");
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write("some test text");
        res.end();
      }
      else if (req.url.includes('/updateSpecific')) {
        const reqParams = req.url.split('/');
        const inputValue = reqParams[2];
        Output(`Updating article ${inputValue}`);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(`some test text - ${inputValue}`);
        res.end();
      }
      else if (req.url.includes('/removeSpecific')) {
        const reqParams = req.url.split('/');
        const inputValue = reqParams[2];

        Output(`Removing article ${inputValue}`);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(`Removing article - ${inputValue}`);
        res.end();
      }
      else if (req.url === '/events') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(`${log_to_server_queue[0]}\n`);
        res.end();
        log_to_server_queue.shift();
      }
      else {
        // Invalid POST request
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Invalid POST request');
      }
    }
  });

  server.listen(port, localIP, () => {
    Output(`Server on http://${localIP}:${port}`);
    //Output(`Server on http://127.0.0.1:${port}`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      let randomValue = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000;
      Output(`Port ${port} is already in use. Changing port to ${randomValue}`);
      port = randomValue;
      StartServer();
    }
    else {
      console.log(e.code);
    }
  });
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let name in interfaces) {
    for (let iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost if no IP is found
}

// Function to get the content type based on the file extension
function getContentType(filePath) {
  const extname = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mp4': 'video/mp4',
  };

  return mimeTypes[extname] || 'application/octet-stream';
}

// Function to serve static files
function serveStaticFile(filePath, contentType, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        // Other read errors
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>500 Internal Server Error</h1><p>${err.message}</p>`);
      }
    } else {
      // File read successfully, serve it
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

function Output(outputData) {
  console.log(outputData.toString());
  log_to_file_queue.push(outputData.toString());
}

async function LogData() {
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (log_to_file_queue.length > 0) {
      await fs.appendFile(logFilePath, `"${GetDateTime()}":${JSON.stringify(log_to_file_queue[0], null, 2)}\n`, (err) => { });
      log_to_file_queue.shift();
    }
  }
}

function GetDateTime() {
  const currentDate = new Date();
  //DD-MM-YY--HH-MM-SS
  const now = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}--${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
  return now
}


LogData();
StartServer();