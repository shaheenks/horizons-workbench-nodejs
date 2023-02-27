const express = require('express');
const router = express.Router();

const { v1 } = require('uuid');

const logger = require("../utils/logger");

const { SampleEngine } = require('../services/sample-engine');
const sampleEngine = new SampleEngine();

const APP = process.env.APP || 'TEMPLATE';

router.use((req, res, next) => {
    logger.debug(`ROUTER ${req.method} ${req.path}`);
    next();
});

router.get('/', (req, res) => res.redirect('/live'));
router.get('/live', (req, res) => res.send( `LIVE`));
router.get('/logs', (req, res) => res.send(logger.logs));

const { SampleService } = require('../services/sample-service');
const sampleService = new SampleService();

router.post('/event/:action', (req, res) => {
    let uuid = v1();
    let event = {
        uuid: uuid,
        corelationId: uuid,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        eventSource: 'sample-engine',
        eventTarget: 'sample-service',
        targetAction: req.params.action,
        targetAttributes: { ...req.body },
        eventStatus: 'queued',
        responseData: {},
        eventsDipatched: []
    };

    sampleEngine.dispatch(
        event,
        (flag) => {
            if (flag) res.send(event)
            else res.status(500).send(event)
        }
    )
});

module.exports = router