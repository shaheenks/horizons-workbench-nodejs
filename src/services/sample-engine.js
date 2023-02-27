const AMQP_URI = process.env.AMQP_URI || 'amqp://localhost:5672';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const QUEUE = process.env.QUEUE || 'sample-service';

const COMPONENT = 'SAMPUB'

const amqplib = require('amqplib');
const { MongoClient } = require('mongodb') ;

const logger = require("../utils/logger");

class SampleEngine {
    mqo;
    dbo;

    constructor() {
        amqplib.connect(AMQP_URI)
            .then((conn) => {
                logger.info(`${COMPONENT} AMQPCL mq connected`);
                this.mqo = conn;

                return MongoClient.connect(MONGO_URI)
            })
            .then(client => {
                logger.info(`${COMPONENT} MONGOC db connected`);
                this.dbo = client.db('horizons')
            })
            .catch(err => logger.error(`${COMPONENT} BOOTST failed ${JSON.stringify(err)}`))
    }

    dispatch(event, callback) {
        switch (event.eventTarget) {
            case 'sample-service':
                this.dispatchToSampleService(event, flag => callback(flag));
            break;
            default:
                logger.warn(`${COMPONENT} DISPA ${event.eventTarget} target not found`);
                callback(false);
        }
    };

    dispatchToSampleService(event, callback) {
        let allowedActions = ['create',];

        if (allowedActions.includes(event.targetAction)) {
            this.pushToQueue(event, flag => callback(flag));

        } else {
            logger.warn(`${COMPONENT} SAMPLE ${event.targetAction} action not found`);
            callback(false);
        }
    };

    acknowledge(payload, callback) {
        logger.debug(`ACKNO new acknowledgement`, payload);
        this.dbo.collection('sample-events').updateOne(
            { "uuid": payload.uuid },
            { "$set": { "responseData": payload.responseData, "modifiedAt": new Date().toISOString(), "eventStatus": "acknowledged" } },
            { upsert: true }
        )
        .then(result => {
            logger.debug(`${COMPONENT} ACKNO acknowledgement received`);
            callback(result.acknowledged)
        })
        .catch(err => {
            logger.warn(`${COMPONENT} ACKNO something went wrong`, err);
            callback(false)
        })
    }

    pushToQueue(payload, callback) {
        logger.debug(`${COMPONENT} PUSHQ new event`, payload);
        this.mqo.createChannel()
            .then(ch => {
                ch.assertQueue(QUEUE, { durable: false })
                .then(() => ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload))))
                .then(() => ch.close())
                .catch(err => logger.warn(`${COMPONENT} AMQPU message error`))

                return this.dbo.collection('sample-events').insertOne(payload);
            })
            .then((result) => {
                logger.debug(`${COMPONENT} PUSHQ event published`);
                callback(result.acknowledged)
            })
            .catch(err => {
                logger.error(`${COMPONENT} PUSHQ publish failed`, err);
                callback(false)
            })
    }
}

module.exports = {
    SampleEngine
}