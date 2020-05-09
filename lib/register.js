const _ = require('lodash');
const mongoose = require('mongoose');

const {
    lookupInjection
} = require('./helpers');

/**
 * Used validators
 *
 * If you wish to create a new validator, set name for the method-
 * assign to type 'general' and define the body of your validator
 */
module.exports = (load) => {
    load('isNotEmpty', 'general', function (value) {
        return !(value === undefined ||
            value === null ||
            (typeof value === "object" && Object.keys(value).length === 0) ||
            (typeof value === "string" && value.trim().length === 0))
    });

    load('isExists', 'general', function (value) {
        return !_.isNil(value);
    });

    load('isString', 'general', function (value) {
        return _.isString(value);
    });

    load('isNumber', 'general', function (value) {
        return _.isNumber(value);
    });

    load('isBoolean', 'general', function (value) {
        return _.isBoolean(value);
    });

    load('isObject', 'general', function (value) {
        return _.isObject(value);
    });

    load('isMongoId', 'general', function (value) {
        return mongoose.isValidObjectId(value);
    });

    load('isFirebaseId', 'general', function (value) {
        return /^(?!.*(\|\?))[a-zA-Z0-9]{28,32}$/.test(value);
    });

    load('isUUIDv4', 'general', function (value) {
        return /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/.test(value);
    });

    load('isInjected', 'custom', function (value, opts) {
        return lookupInjection(value, opts);
    });
};
