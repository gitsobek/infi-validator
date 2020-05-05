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

    load('isMongoId', 'general', function (value) {
        return mongoose.isValidObjectId(value);
    });

    load('isInjected', 'custom', function (value, opts) {
        return lookupInjection(value, opts);
    });
};
