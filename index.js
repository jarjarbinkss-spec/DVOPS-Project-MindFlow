var express = require('express');
var bodyParser = require('body-parser');
var app = express();

const PORT = process.env.PORT || 5050;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./public'));

// ---------------------------------------------------------------
// Routes (each team member registers their own route(s) below)
// ---------------------------------------------------------------

// Read tasks (Ahmad)
const { viewTasks } = require('./utils/AhmadUtil.js');
app.get('/view-tasks', viewTasks);

// Read: View / Filter Workload Tasks (Ahmad)
const { viewTasks } = require('./utils/AhmadUtil');
app.get('/view-tasks', viewTasks);

var server = app.listen(PORT, function () {
    const address = server.address();
    const baseUrl = `http://${address.address == '::' ? 'localhost' : address.address}:${address.port}`;
    console.log(`MindFlow running at: ${baseUrl}`);
});

module.exports = { app, server };
