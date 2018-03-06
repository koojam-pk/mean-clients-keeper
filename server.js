const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Port
const PORT = process.env.PORT || 3000;

const app = express();

// Init routes
const apiRoutes = require('./routes/api');

// Set static folder
app.use(express.static(path.join(__dirname, 'dist')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Allow requests from Angular
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http:/localhost:4200');
    res.setHeader('Access-Control-Allow-Methods', 'GET', 'POST', 'PUT', 'DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log('Server listening on port, ' + PORT);
});
