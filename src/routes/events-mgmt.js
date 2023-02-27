const express = require('express');
const router = express.Router();

const { v1 } = require('uuid');

const logger = require("../utils/logger");

const { EventMgmtEngine } = require('../services/events-mgmt-engine');
const eventMgmtEngine = new EventMgmtEngine();

const APP = process.env.APP || 'TEMPLATE';

router.use((req, res, next) => {
    logger.debug(`ROUTER ${req.method} ${req.path}`);
    next();
});

router.get('/', (req, res) => res.redirect('/live'));
router.get('/live', (req, res) => res.send( `LIVE`));
router.get('/logs', (req, res) => res.send(logger.logs));

const { SmartApiService } = require('../services/smartapi-service');
const smartapiService = new SmartApiService();

router.post('/smartapi/:action', (req, res) => {
    let uuid = v1();
    let event = {
        uuid: uuid,
        corelationId: uuid,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        eventSource: 'events-mgmt-engine',
        eventTarget: 'smartapi-service',
        targetAction: req.params.action,
        targetAttributes: { ...req.body },
        eventStatus: 'queued',
        responseData: {},
        eventsDipatched: []
    };

    smartapiService.dispatch(
        event,
        (flag) => {
            if (flag) res.send(event)
            else res.status(500).send(event)
        }
    )
});

module.exports = router