#!/usr/local/bin/node
'use strict'
const config = require('./config');
const express = require('express');

var app = express();

app.get('/public', (req, res) => {
    res.json({
        message: 'Public'
    });
});

app.get('/protected', (req, res) => {
    res.json({
        message: 'Protected'
    });
});

app.get('*', (req, res) => {
    res.sendStatus(404);
});

app.listen(config.PORT, () => {
    console.log(`Service listening on PORT ${config.PORT}`);
});

process.on('SIGINT', () => process.exit());
