module.exports = { Add_To_Server_Queue };

var http = require('http');
var fs = require('fs');
var os = require('os');
var path = require('path');

const { Program_Switch } = require('./Utilities/Migration Tool.js');
const { LogInfo } = require('./Utilities/Logger.js');

var port = 9929; //Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000;
const localIP = getLocalIP();
const log_to_server_queue = [];

function StartServer() {
  const server = http.createServer((req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    //LogInfo(`Requested URL: ${req.url} at: ${clientIP}`);
    if (req.url !== "/events") {
      LogInfo(`Requested URL: ${req.url} at: ${clientIP}`);
    }

    if (req.method === 'GET') {
      const filePath = `.${req.url === '/' ? '/index.html' : req.url}`;
      const contentType = getContentType(filePath);
      serveStaticFile(filePath, contentType, res);
    }

    else if (req.method === 'POST') {
      if (req.url === '/update&Create') {
        LogInfo("Updating and Creating new articles");
        Program_Switch(1).then(result => {
          if (result) {
            LogInfo("Update & Create operation completed.");
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.write('event: disableButtons');
            res.end();
          }
        });
      } else if (req.url === '/updateOnly') {
        LogInfo("Updating all articles");
        Program_Switch(2).then(result => {
          if (result) {
            LogInfo("Update operation completed.");
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.write('event: disableButtons');
            res.end();
          }
        });
      } else if (req.url === '/createOnly') {
        LogInfo("Creating new articles");
        Program_Switch(3).then(result => {
          if (result) {
            LogInfo("Create operation completed.");
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.write('event: disableButtons');
            res.end();
          }
        });
      } else if (req.url.includes("/updateSpecific")) {
        const inputValue = req.url.split("/")[2];
        LogInfo(`Updating article ${inputValue}`);
        Program_Switch(2, inputValue).then(result => {
          if (result) {
            LogInfo("Update Specific operation completed.");
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.write('event: disableButtons');
            res.end();
          }
        });
      } else if (req.url.includes("/createSpecific")) {
        const inputValue = req.url.split("/")[2];
        LogInfo(`Creating article ${inputValue}`);
        Program_Switch(3, inputValue).then(result => {
          if (result) {
            LogInfo("Create Specific operation completed.");
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.write('event: disableButtons');
            res.end();
          }
        });
      } else if (req.url.includes("/removeSpecific")) {
        
      } else if (req.url === "/events") {
        if (log_to_server_queue.length > 0) {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.write(log_to_server_queue + '\n');
          log_to_server_queue.shift();
          res.end();
        }
        else {
          res.end();
        }
      } else {
        // Invalid POST request
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Invalid POST request');
      }
    }
  });

  server.listen(port, localIP, () => {
    LogInfo(`Server on http://${localIP}:${port}`);
    //Output(`Server on http://127.0.0.1:${port}`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      let randomValue = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000;
      LogInfo(`Port ${port} is already in use. Changing port to ${randomValue}`);
      port = randomValue;
      StartServer();
    }
    else {
      LogInfo(e.code);
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

function Add_To_Server_Queue(val) {
  log_to_server_queue.push(val);
}

StartServer();