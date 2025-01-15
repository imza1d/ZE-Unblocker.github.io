const https = require('https');
const fs = require('fs');
const path = require('path');
const ssl = {
    key: fs.readFileSync(path.join(__dirname, '/ssl.key')),
    cert: fs.readFileSync(path.join(__dirname, '/ssl.cert')),
};
const server = https.createServer(ssl);
const Corrosion = require('../');
const proxy = new Corrosion({
    codec: 'xor',
});

proxy.bundleScripts();

// Allowing additional HTTP methods
server.on('request', (request, response) => {
    if (request.url.startsWith(proxy.prefix)) {
        // If the URL matches the proxy prefix, forward the request
        return proxy.request(request, response);
    }
    
    // Handle other HTTP methods (POST, PUT, DELETE, etc.)
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        return response.end(`Method ${request.method} Not Allowed`);
    }
    
    // Default handling for other cases
    response.end(fs.readFileSync(__dirname + '/index.html', 'utf-8'));
}).on('upgrade', (clientRequest, clientSocket, clientHead) => {
    proxy.upgrade(clientRequest, clientSocket, clientHead);
}).listen(443);
