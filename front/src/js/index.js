'use strict'
const config = require('./config.js');

var connection;

window.WebSocket = window.WebSocket || window.MozWebSocket;

if (!window.WebSocket) {
    alert('Sorry, no magic for you.');
    return;
}

connection = new WebSocket('wss://www.dorinbotan.com:8080');
connection.onopen = connectionOpened;
connection.onerror = connectionError;
connection.onmessage = messageReceived;

function connectionOpened() {
    console.log('Connected');
}

function connectionError() {
    console.log('Could not connect');
    connection = undefined;

    document.getElementById('tibidoh').innerHTML += ' \n... сломался';
}

function messageReceived(message) {
    try {
        console.log(JSON.parse(message.data));

        var request = JSON.parse(message.data);

        if (request.instruction == 'REDIRECT') {
            window.location.replace(request.url);
        }
    } catch (e) {
        console.log('Invalid input message format');
    }
}

/*
function messageSend(message) {
  if(connection) {
    connection.send(message);
  } else {
    console.log('No connection');
  }
}
*/

main();
