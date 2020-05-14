'use strict';

const {
    detectOpt,
    castCorrectType
} = require('../lib/helpers');

const InfiValidator = require('../lib/validator');

describe('Validate request', () => {
    let req, validator;

    beforeEach(() => {
        req = {
            params: {
                userId: 1,
                docId: '5e8703d290165868e8c2cd50',
                wrongDocId: '5e8703d290165868e8c2cd50xxx',
                firebaseDocId: 'A1pE4Up36ORa3QcWBMxrrnKjIK72',
                notAFirebaseDocId: 'JUA84jfA73Dp'
            },
            body: {
                secureKey: {
                    token: 'yMl.123'
                },
                notSecureKey: {
                    $gt: ''
                },
                isAdmin: true,
                accessLevels: [1, 2, 3]
            },
            query: {
                title: 'Research about secure Node.js apps',
                emptyTitle: '',
                UUIDv1: '307d2376-91f9-11ea-bb37-0242ac130002',
                UUIDv4: '3d1e0dc9-3c5a-43fa-a3ea-5e758e92c6fe',
            }
        };
        validator = new InfiValidator(req);
    });

    it('confirms mocked object correctness', () => {
         expect(Object.keys(req)).toEqual(expect.arrayContaining(['params', 'body', 'query']));

         const { params, body, query } = req;

         expect(params.userId).toEqual(expect.any(Number));
         expect(params.docId).toEqual(expect.any(String));
         expect(params.wrongDocId).toEqual(expect.any(String));
         expect(params.docId).toEqual(expect.not.stringMatching(params.wrongDocId));

         expect(body.secureKey).toEqual(expect.any(Object));
         expect(body.secureKey).toEqual(expect.any(Object));
         expect(body.secureKey).not.toBe(body.notSecureKey);

         expect(query.title).toEqual(expect.any(String));
         expect(query.emptyTitle).toEqual(expect.any(String));
         expect(query.emptyTitle).toHaveLength(0);
    });

    it('throws error on empty request object', () => {
        expect.assertions(2);

        function checkThisRequest() {
            const emptyValidatorObj = new InfiValidator(null);

            emptyValidatorObj
                .checkValues('params', {
                    userId: 'isExists'
                });
        }

        expect(checkThisRequest).toThrow();
        expect(checkThisRequest).toThrowError(/^A valid Express request object is required for validation.$/)
    });

    it('detects existing value in params object (params => userId)', () => {
        expect.assertions(1);
        validator
            .checkValues('params', {
                userId: ['isExists', 'isNotEmpty']
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('detects correct Mongo ID in params object (params => docId)', () => {
        expect.assertions(1);
        validator
            .checkValues('params', {
                docId: ['isMongoId']
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('detects incorrect Mongo ID in params object (params => wrongDocId)', () => {
        expect.assertions(3);
        validator
            .checkValues('params', {
                wrongDocId: ['isMongoId']
            });

        const hasError = validator.hasErrors();
        const error = validator.getFirstError();

        expect(hasError).toBe(true);
        expect(error.code).toBe(400);
        expect(error.message).toBe(`Bad request. Provided 'wrongDocId' is not a Mongo ID.`);
    });

    it('detects correct Firebase ID in params object (params => firebaseDocId)', () => {
        expect.assertions(1);
        validator
            .checkValues('params', {
                firebaseDocId: ['isFirebaseId']
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('detects incorrect Firebase ID in params object (params => notAFirebaseDocId)', () => {
        expect.assertions(3);
        validator
            .checkValues('params', {
                notAFirebaseDocId: ['isFirebaseId']
            });

        const hasError = validator.hasErrors();
        const error = validator.getFirstError();

        expect(hasError).toBe(true);
        expect(error.code).toBe(400);
        expect(error.message).toBe(`Bad request. Provided 'notAFirebaseDocId' is not a Firebase ID.`);
    });


    it('detects No-SQL injection and sanitizes the body (body => notSecureKey)', () => {
        expect.assertions(1);

        const cleanBody = {
            secureKey: {
                token: 'yMl.123'
            },
            notSecureKey: {
                gt: ''
            },
            isAdmin: true,
            accessLevels: [1, 2, 3]
        };

        validator
            .checkValues('body', {
                secureKey: ['isNotEmpty'],
                notSecureKey: ['isNotEmpty'],
            })
            .cleanInjections();

        const { body } = validator.getSafeObject();

        expect(body).toEqual(cleanBody);
    });

    it('detects value is object (body => secureKey)', () => {
        expect.assertions(1);

        validator
            .checkValues('body', {
                secureKey: ['isObject'],
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('detects correct key name in object (body => secureKey)', () => {
        expect.assertions(3);

        const isInObj = 'token' in req.body.secureKey;
        expect(typeof isInObj).toBe('boolean');
        expect(isInObj).toBe(true);

        validator
            .checkValues('body', {
                secureKey: ['hasObjectKey:token'],
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('detects value is boolean (body => isAdmin)', () => {
        expect.assertions(1);

        validator
            .checkValues('body', {
                isAdmin: ['isBoolean'],
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('detects value is array (body => accessLevels)', () => {
        expect.assertions(1);

        validator
            .checkValues('body', {
                accessLevels: ['isArray'],
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('detects array has correct length (body => accessLevels)', () => {
        expect.assertions(3);

        const sizeOfArr = req.body.accessLevels.length;
        expect(typeof sizeOfArr).toBe('number');
        expect(sizeOfArr).toBe(3);

        validator
            .checkValues('body', {
                accessLevels: ['hasLength:3'],
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('detects array has element of correct passed value (body => accessLevels)', () => {
        expect.assertions(3);

        const hasElementOfTwo = !!req.body.accessLevels.find(v => v === 2);
        expect(typeof hasElementOfTwo).toBe('boolean');
        expect(hasElementOfTwo).toBe(true);

        validator
            .checkValues('body', {
                accessLevels: ['hasArrayItem:2'],
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('detects value is string (query => title)', () => {
        expect.assertions(1);

        validator
            .checkValues('query', {
                title: ['isString'],
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('provides valid UUID Version 4 and detects correct version in uuid v4 validator (query => UUIDv4)', () => {
        expect.assertions(1);

        validator
            .checkValues('query', {
                UUIDv4: ['isUUIDv4'],
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
    });

    it('provides valid UUID Version 1 and detects incorrect version in uuid v4 validator (query => UUIDv1)', () => {
        expect.assertions(3);

        validator
            .checkValues('query', {
                UUIDv1: ['isUUIDv4'],
            });

        const hasError = validator.hasErrors();
        const error = validator.getFirstError();

        expect(hasError).toBe(true);
        expect(error.code).toBe(400);
        expect(error.message).toBe(`Bad request. Provided 'UUIDv1' is not a UUID Version 4.`);
    });

    it('detects two invalid properties and returns correct number of errors (params => wrongDocId && query => emptyTitle)', () => {
        expect.assertions(3);

        validator
            .checkValues('params', {
                wrongDocId: ['isMongoId'],
            })
            .checkValues('query', {
                emptyTitle: ['isNotEmpty'],
            });

        const errors = validator.getErrors();
        expect(errors).toHaveLength(2);

        const [, errOfTitle] = errors;
        expect(errOfTitle.code).toBe(400);
        expect(errOfTitle.message).toBe(`Bad request. Empty 'emptyTitle' provided.`);
    });

    it('throws error when wrong location specified', () => {
        expect.assertions(2);

        function checkThisLocation() {
            validator
                .checkValues('noSuchLocation', {
                    userId: 'isExists',
                });
        }

        expect(checkThisLocation).toThrow();
        expect(checkThisLocation).toThrowError(/^Invalid location name: noSuchLocation$/)
    });

    it('converts passed argument to a correct type (helpers: castCorrectType)', () => {
        expect.assertions(10);

        const maybeNum = castCorrectType('24');
        const maybeBool = castCorrectType('true');
        const maybeNull = castCorrectType('null');
        const maybeUndefined = castCorrectType('undefined');
        const maybeStillString = castCorrectType('abc');

        expect(typeof maybeNum).toBe('number');
        expect(maybeNum).toBe(24);

        expect(typeof maybeBool).toBe('boolean');
        expect(maybeBool).toBe(true);

        /* typeof null === 'object' -- documented behavior in MDN page */
        expect(typeof maybeNull).toBe('object');
        expect(maybeNull).toBe(null);

        expect(typeof maybeUndefined).toBe('undefined');
        expect(maybeUndefined).toBe(undefined);

        expect(typeof maybeStillString).toBe('string');
        expect(maybeStillString).toBe('abc');
    });

    it('detects complex validator (helpers: detectOpt)', () => {
        expect.assertions(2);

        const { arg, opName } = detectOpt('hasLength:4', {});

        expect(arg).toBe('4');
        expect(opName).toBe('hasLength');
    });

    afterEach(() => {
        validator = null;
    });
});
