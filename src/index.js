require('dotenv').config();

const express = require('express');
const app = express();

const logger = require("./utils/logger");

const PORT = process.env.PORT || 4000;
const COMPONENT = 'SYSTEM'

app.use(express.json({limit: '5mb'})); // for parsing application/json

// SAMPLE engine & service
// const sampleRoute = require('./routes/sample');
// app.use('/sample', sampleRoute);

const eventsMgmtRoute = require('./routes/events-mgmt');
app.use('/events', eventsMgmtRoute);

app.listen(PORT, () => {
    logger.info(`${COMPONENT} SINDEX listening on *:${PORT}`)
});