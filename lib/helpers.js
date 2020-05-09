const xss = require('xss');
const _ = require('lodash');
const chalk = require('chalk');
const moment = require('moment');

const logPrefix =
    `infi::${process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'dev'}`;

/* Common mongoose operators */
const mongooseOps = [
    '$eq',
    '$ne',
    '$ni',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$regex',
    '$where'
];

const _log = (type = "log", content) => {
    const timestamp = `[${moment().format("YYYY-MM-DD HH:mm:ss")}]`;
    switch (type) {
        case "log": {
            return console.log(`[${logPrefix}] ${timestamp}: ${chalk.blue(type.toUpperCase())}`, ...content)
        }
        case "warn": {
            return console.log(`[${logPrefix}] ${timestamp}: ${chalk.yellow(type.toUpperCase())}`, ...content)
        }
        case "error": {
            return console.log(`[${logPrefix}] ${timestamp}: ${chalk.red(type.toUpperCase())}`, ...content)
        }
        case "ready": {
            return console.log(`[${logPrefix}] ${timestamp}: ${chalk.green(type.toUpperCase())}`, ...content)
        }
        default:
            throw new TypeError("Wrong logger type.")
    }
};

const log = (...args) => _log("log", args);

const warn = (...args) => _log("warn", args);

const error = (...args) => _log("error", args);

const ready = (...args) => _log("ready", args);

/**
 * Traverses request recursively and removes vulnerabilities
 *
 * @param {Object} value - current iterated node
 * @param {Object} opts - specified options
 * @param {Object} depth - current and maximum depth tracing data
 * @param {Object} additions - additional data (etc. status)
 * @return { {data: Object, isNoSQLInjected: boolean} } sanitized data object
 */
exports.lookupInjection = (
    value,
    opts,
    depth = { maxDeepLevel: 1, currDeepLevel: 1 },
    additions = { isNoSQLInjected: false }
) => {
    let { deepLevel } = opts;

    depth.maxDeepLevel = Math.max(depth.currDeepLevel, depth.maxDeepLevel);

    if (deepLevel === depth.maxDeepLevel) {
        warn(`[Validator] Maximum number of allowed deep traversal operations has been exceed (max: ${deepLevel}).`);
        return { data: value, isNoSQLInjected: additions.isNoSQLInjected };
    }

    _.forOwn(value, (val, key) => {
        if (_.includes(mongooseOps, key) && value.hasOwnProperty(key)) {
            additions.isNoSQLInjected = true;

            const newKey = key.replace(/[^A-Za-z0-9]/, '');
            delete Object.assign(value, {[newKey]: value[`${key}`] })[`${key}`];

            key = newKey;
        }

        if (_.isArray(val)) {
            value[`${key}`] = val.map(el => {
                if (_.isObject(el)) {
                    depth.currDeepLevel++;
                    this.lookupInjection(el, opts, depth, additions);
                } else {
                    if (_.isString(el)) {
                        el = xss(el);
                    }
                }
                return el;
            });
        } else if (_.isObject(val)) {
            depth.currDeepLevel++;
            this.lookupInjection(val, opts, depth, additions);
        } else {
            if (_.isString(val)) {
                value[`${key}`] = xss(val);
            }
            depth.currDeepLevel = 1;
        }
    });

    return { data: value, isNoSQLInjected: additions.isNoSQLInjected };
};

exports.logger = {
    log,
    warn,
    error,
    ready
};

