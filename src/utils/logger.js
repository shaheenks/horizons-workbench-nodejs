const log = require("loglevel");
log.setLevel("trace");

class Logger {

    constructor() {
        this.APP = process.env.APP || 'HWORKB';
        this.logSpool = [];
    }

    error(msg) {
        let logMessage = `[ERROR] ${new Date().toISOString()} ${this.APP} ${msg}`
        this.logSpool.push(logMessage)
        
        log.error(logMessage);
    }

    warn(msg, obj) {
        let logMessage = `[WARNI] ${new Date().toISOString()} ${this.APP} ${msg}`
        this.logSpool.push(logMessage)
        
        log.warn(logMessage);
        if (obj != null) log.warn(obj)
    }

    info(msg) {
        let logMessage = `[INFOR] ${new Date().toISOString()} ${this.APP} ${msg}`
        this.logSpool.push(logMessage)
        
        log.info(logMessage);
    }

    debug(msg, obj) {
        let logMessage = `[DEBUG] ${new Date().toISOString()} ${this.APP} ${msg}`
        this.logSpool.push(logMessage)
        
        log.debug(logMessage);
        if (obj != null) log.debug(obj)
    }

    trace(msg) {
        let logMessage = `[TRACE] ${new Date().toISOString()} ${this.APP} ${msg}`
        this.logSpool.push(logMessage)
        
        log.trace(logMessage);
    }

    get logs() {
        return this.logSpool;
    }
};

module.exports = new Logger;