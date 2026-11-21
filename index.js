var express = require('express');
var bodyParser = require('body-parser');
var { updateFocusSession } = require('./utils/VineetUtil');
var app = express();

const PORT = process.env.PORT || 5050;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./public'));

// ---------------------------------------------------------------
// Routes (each team member registers their own route(s) below)
// ---------------------------------------------------------------

// Member 3 (Vineet): Update Focus Session
app.put('/update-session/:id', async function (req, res) {
    const result = await updateFocusSession(req.params.id, req.body);
    return res.status(result.status).json(result.body);
});

var server = app.listen(PORT, function () {
    const address = server.address();
    const baseUrl = `http://${address.address == '::' ? 'localhost' : address.address}:${address.port}`;
    console.log(`MindFlow running at: ${baseUrl}`);
});

module.exports = { app, server };