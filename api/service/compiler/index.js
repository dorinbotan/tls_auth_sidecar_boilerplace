#!/usr/bin/nodejs
'use strict'
const config = require('./config');
const express = require('express');
const spawn = require('child_process').spawn;

const user  = 'dbotan';
const proj  = 'sandbox';
const image = 'tmp';

function runContainer(image, user) {
    if (!image || !user) return;

    var child = spawn('docker', [ 'run', '--rm', '-t', '-v', `${process.env.PWD}/users/${user}/${proj}:/root/src`, `${image}` ]);
    // var child = spawn('docker', [ 'run', '--rm', '-t', '-v', '/home/dbotan/tmp/c/src:/root/src', '--name', `${user}`, `${image}` ]);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    // child.stdout.on('data', (chunk) => {
    //     process.stdout.write(`${chunk}`);
    // });

    // child.stderr.on('data', (chunk) => {
    //     process.stderr.write(chunk);
    // });

    child.on('close', (code) => {
        console.log(`Exited with code ${code}`);
    });
}

var app = express();

app.get('/', (req, res) => {
    runContainer(image, user);
    res.send('Hello world!');
});

app.listen(config.PORT, () => {
    console.log(`Listening on port ${config.PORT}`);
});
