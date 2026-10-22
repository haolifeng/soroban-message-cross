

const winston = require("winston");
require('winston-daily-rotate-file');
const moment = require('moment');
const util = require('util');
const MESSAGE = Symbol.for('message');
const SPLAT = Symbol.for('splat');
const path = require('path');


class Logger {


    constructor(name, file, errorFile, level = 'info'){
        this.name = name;
        this.file = file;
        this.errorFile = errorFile;
        this.level = level;

        this.filePath = file;
        this.errorFilePath = errorFile;

        this.init(this.name, this.file, this.errorFile, this.level);

    }
    init(name, file, errorFile, level){
        this.logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            level:level,
            format:winston.format(function(info, opts){
                let prefix = util.format('%s %s %s', moment().format('YYYY-MM-DD HH:mm:ss,SSS').trim(),name, info.level.toUpperCase());
                if (info[SPLAT]) {
                    info[MESSAGE] = util.format('%s %s', prefix, util.format(info.message, ...info[SPLAT]));
                } else {
                    info[MESSAGE] = util.format('%s %s', prefix, util.format(info.message));
                }
                return info;
            })(),
            transports:[
                //new winston.transports.Console({
                //    handleExceptions: true
                //}),
                new(winston.transports.DailyRotateFile)({
                    filename: this.filePath,
                    level: level,
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: false,
                    maxSize: '50m',
                    maxFiles: '30d'
                })
            ],
            exitOnError: false
        });
    }
    __line() {
        let logger = this;
        try {
            const e = new Error();
            const regex = /\((.*):(\d+):(\d+)\)$/
            const errLocation = e.stack.split("\n")[2];
            const match = regex.exec(errLocation);
            if (!match) {
                return errLocation.trim();
            }
            return match[1] + ":" + match[2];
        } catch (err) {
            logger.warn("Logger::__line error");
            logger.warn(err);
            return "";
        }
    }
    debug(...params) {
        try {
            this.logger.debug(...params);
        } catch(err) {
            // this.init(this.name, this.file, this.errorFile, this.level);
            this.error(err);
        }
    }

    info(...params) {
        try {
            this.logger.info(...params);
        } catch(err) {
            // this.init(this.name, this.file, this.errorFile, this.level);
            this.error(err);
        }
    }

    warn(...params) {
        try {
            this.logger.warning(...params);
        } catch(err) {
            // this.init(this.name, this.file, this.errorFile, this.level);
            this.error(err);
        }
    }

    error(...params) {
        try {
            this.logger.error(...params);
        } catch(err) {
            // this.init(this.name, this.file, this.errorFile, this.level);
            // this.logger.error(err);
            console.log(err);
        }
    }

}
module.exports = Logger
