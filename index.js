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

// Read and Delete tasks (Ahmad)
const { viewTasks, deleteTask } = require('./utils/JohnTanUtil');
app.get('/view-tasks', viewTasks);
app.delete('/delete-task/:id', deleteTask);

var server = app.listen(PORT, function () {
    const address = server.address();
    const baseUrl = `http://${address.address == '::' ? 'localhost' : address.address}:${address.port}`;
    console.log(`MindFlow running at: ${baseUrl}`);
});

module.exports = { app, server };
