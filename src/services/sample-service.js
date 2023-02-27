const QUEUE = process.env.QUEUE || 'sample-service';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const AMQP_URI = process.env.AMQP_URI || 'amqp://localhost:5672';

const amqplib = require('amqplib');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

const COMPONENT = 'SAMSER'

class SampleService {
    mqo;
    dbo;

    constructor() {
        MongoClient.connect(MONGO_URI)
            .then(client => {
                logger.info(`${COMPONENT} MONGOC db connected`);
                this.dbo = client.db("horizons")

                return amqplib.connect(AMQP_URI)
            })
            .then(conn => {
                this.mqo = conn;
                logger.info(`${COMPONENT} AMQPCL mq connected`);

                return conn;
            })
            .then(conn => conn.createChannel())
            .then(ch => {
                ch.assertQueue(QUEUE, { durable: false })
                .then((q) => {
                    logger.info(`${COMPONENT} AMQPCL listening to ${QUEUE}`);

                    ch.prefetch(1)
                    ch.consume(q.queue, (msg) => {
                        if (msg !== null) {
                            let msgObj = JSON.parse(msg.content.toString());
                            logger.debug(`${COMPONENT} AMQPCL new message`, msgObj);
                            this.dispatchEvent(msgObj, (flag) => {
                                if (flag) ch.ack(msg)
                                else {
                                    logger.debug(`${COMPONENT} AMQPCL msg rejected`)
                                    ch.ack(msg)
                                }
                            })
                        } else {
                            logger.warn(`${COMPONENT} AMQPCL message error`);
                        }
                    })
                })
                .catch((err) => {
                    logger.debug(`${COMPONENT} AMQPCL channel creation failed.`, err)
                })
            })
            .catch((err) => logger.debug(`${COMPONENT} AMQPCL bootstrap failed.`))
    };

    dispatchEvent(event, callback) {
        let verifyPayload;
        switch (event.targetAction) {
            case 'create':
                verifyPayload = event.targetAttributes.hasOwnProperty("username") && 
                                event.targetAttributes.hasOwnProperty("password")
                if (verifyPayload) callback(true)
                else callback(false)

                break;
            default:
                logger.warn(`${COMPONENT} DISPA ${event.action} not found`);
                callback(true);
        }
    };

}

module.exports = {
    SampleService
}