#!/usr/local/bin/node
'use strict'
const config = require('./config');
const fs = require('fs');
const httpProxy = require('http-proxy');
const https = require('https');
const cors = require('cors');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const express = require('express');

var memoryStore = new session.MemoryStore();
var keycloak = new Keycloak({ store: memoryStore });

const app = express();
app.use(cors());
app.use(session({
    secret: 'my very secret secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));
app.use(keycloak.middleware());

const apiProxy = httpProxy.createProxyServer();

/* Template protected resource */
app.get('/protected', keycloak.protect(), (req, res) => {
    apiProxy.web(req, res, { target: config.TARGET }, console.log);
});

/* Template unprotected resource */
app.all('*', (req, res) => {
    apiProxy.web(req, res, { target: config.TARGET }, console.log);
});

https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/api.dorinbotan.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/api.dorinbotan.com/fullchain.pem'),
}, app)
.listen(config.PORT, () => {
    console.log(`Reverse proxy listening on PORT ${config.PORT}`);
});

process.on('SIGINT', () => process.exit());
