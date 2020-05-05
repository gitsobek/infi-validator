/* eslint-disable security/detect-object-injection */

const _ = require('lodash');
const defaultTemplate = require('./validatorMessages');

const LOCATIONS = ['params', 'query', 'body', 'headers', 'cookies'];

const _privateAddError = Symbol();
const _privateLoadValidators = Symbol();

const {
    logger
} = require('./helpers');

const InfiValidator = function (
    mainObj,
    opts
) {
    this.mainObj = mainObj || {};
    this.options = opts || {};

    /**
     * Error collection
     *
     * @type {Array}
     */
    this._errors = [];

    /**
     * Sanitized request object
     *
     * @type {Object}
     */
    this._safeObj = {};

    /**
     * Loaded validators
     *
     * @type {Object}
     */
    this._validators = {};

    _.defaults(this.options, {
        deepLevel: 100,
        templates: {}
    });

    Object.assign(
        this.options.templates,
        _.omit(defaultTemplate, _.keys(this.options.templates))
    );

    if (_.isEmpty(this.mainObj)) {
        throw new Error('A valid Express request object is required for validation.')
    } else {
        const requiredKeys = LOCATIONS.slice(0, 3);

        _.every(requiredKeys, (key) => {
            if (_.has(key, this.mainObj)) {
                throw new TypeError(`Provided ${key} in request object is not valid.`)
            }

            return true;
        });
    }

    this[_privateLoadValidators]();
};

InfiValidator.prototype = {
    /**
     * Checks the correctness and consistence of values in specified location
     *
     * @param {String} location - specified location in request body
     * @param {Object} params - parameters to be checked against request body
     * @return {InfiValidator} this - chainable object
     */
    checkValues(location, params) {
        const self = this;

        if (_.isNil(location) || !LOCATIONS.includes(location)) {
            throw new Error(`Invalid location name: ${location}`);
        }

        if (_.isEmpty(params) || !_.isObject(params)) {
            throw new Error(`Provided ${location} in request object is not valid.`);
        }

        const isLocationNotEmpty = this._validators.general['isNotEmpty'](this.mainObj[location]);

        if (!isLocationNotEmpty) {
            this[_privateAddError]({
                rule: 'isEmpty', field: location
            })
        }

        for (const key of Object.keys(params)) {
            const ops = params[key];

            if (_.isNil(ops)) {
                continue;
            }

            if (_.isString(ops)) {
                if (_.has(self._validators.general, ops)) {
                    const result = self._validators.general[ops](this.mainObj[location][key], self.options);

                    if (!result) {
                        self[_privateAddError]({
                            rule: ops, field: key, location
                        })
                    }
                } else {
                    logger.warn(`[Validator] Validator of name '${ops}' does not exist.`);

                    continue;
                }
            }

            if (_.isArray(ops)) {
                for (const op of ops) {
                    if (_.has(self._validators.general, op)) {
                        const result = self._validators.general[op](this.mainObj[location][key], self.options);

                        if (!result) {
                            self[_privateAddError]({
                                rule: op, field: key, location
                            })
                        }
                    } else {
                        logger.warn(`[Validator] Validator of name '${op}' does not exist.`);
                    }
                }
            }
        }

        return this;
    },

    /**
     * Removes vulnerabilities and creates sanitized object
     *
     * @return {InfiValidator} this - chainable object
     */
    cleanInjections() {
        if (
            !_.has(this._validators.custom, 'isInjected') ||
            !_.isFunction(this._validators.custom['isInjected'])
        ) {
            return this;
        }

        for (const loc of ['body', 'params', 'query']) {
            const { data, isNoSQLInjected } = this._validators.custom['isInjected'](this.mainObj[loc], this.options);

            if (isNoSQLInjected) {
                const userInfo = this.mainObj.currentUser ? this.mainObj.currentUser.uid : this.mainObj.ip;
                logger.warn(`[Validator] NoSQL Injection detected in \'${loc}\' by user ${userInfo}`);
            }

            this._safeObj[loc] = data;
        }

        return this;
    },

    /**
     * Determine if there are any errors
     *
     * @return {boolean}
     */
    hasErrors() {
        return this._errors && this._errors.length > 0;
    },

    /**
     * Returns the first error, null otherwise
     *
     * @return {Object|null} First error
     */
    getFirstError() {
        if (this._errors && this._errors.length) {
            return this._errors[0];
        }

        return null;
    },

    /**
     * Get all errors
     *
     * @return {Array} Failed attribute names for keys and an array of messages for values
     */
    getErrors() {
        return this._errors;
    },

    /**
     * Returns sanitized request object, otherwise original request with body, params and query
     *
     * @return {Object} Safe request object that contains body, params and query
     */
    getSafeObject() {
        if (_.isNil(this._safeObj) || _.isEmpty(this._safeObj) || _.some(this._safeObj, _.isNil)) {
            logger.warn(`[Validator] Cannot load safe object. Using original one now.`);
            return _.pick(this.mainObj, ['body', 'params', 'query'])
        }
        return _.cloneDeep(this._safeObj);
    },

    /**
     * Loads created validators
     *
     * @return {void}
     */
    [_privateLoadValidators]() {
        const validators = require('./register');

        validators((...args) => {
            if (!_.has(this._validators, args[1])) {
                this._validators[args[1]] = {};
            }

            if (_.has(this._validators[args[1]], args[0])) {
                throw new Error(`Validator named \'${args[0]}\' already exists.`);
            }

            this._validators[args[1]][args[0]] = args[2];
        });
    },

    /**
     * Adds an custom error object to errors collection
     *
     * @param {Object} Data containing template, location, field and error code
     * @return {void}
     */
    [_privateAddError]({rule, field, location, code = 400}) {
        const msgTemplate = this.options.templates[rule];
        let msg = msgTemplate.replace('%1$', field);

        const hasSecondPlaceholder = msgTemplate.includes('%2$');

        if (location && hasSecondPlaceholder) {
            msg = msg.replace('%2$', location);
        }

        this._errors.push({
            code,
            message: msg
        });
    }
};

module.exports = InfiValidator;
