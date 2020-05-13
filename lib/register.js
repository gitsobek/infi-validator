'use strict';

const _ = require('lodash');
const mongoose = require('mongoose');

const {
    lookupInjection,
    castCorrectType
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

    load('isArray', 'general', function (value) {
        return _.isArray(value);
    });

    load('isMongoId', 'general', function (value) {
        return mongoose.isValidObjectId(value);
    });

    load('isFirebaseId', 'general', function (value) {
        return /^(?!.*(\|\?))[a-zA-Z0-9]{28,32}$/.test(value);
    });

    load('isUUIDv1', 'general', function (value) {
        return /^[0-9A-F]{8}-[0-9A-F]{4}-[1][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(value);
    });

    load('isUUIDv4', 'general', function (value) {
        return /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(value);
    });

    load('hasLength', 'general', function (value, opts) {
        const { arg } = opts;

        const _v = castCorrectType(arg);

        if (_.isNil(arg) || !_.isNumber(_v)) {
            return false;
        }

        const vLength = _.size(value);
        return _.isEqual(vLength, _v);
    });

    load('hasArrayItem', 'general', function (value, opts) {
        const { arg } = opts;

        if (!_.isArray(value)) {
            return false;
        }

        const _v = castCorrectType(arg);
        return _.includes(value, _v);
    });

    load('hasObjectKey', 'general', function (value, opts) {
        const { arg } = opts;

        if (_.isNil(arg) || !_.isObject(value)) {
            return false;
        }

        const _v = castCorrectType(arg);
        return _.includes(Object.keys(value), _v);
    });

    load('isInjected', 'custom', function (value, opts) {
        return lookupInjection(value, opts);
    });
};
