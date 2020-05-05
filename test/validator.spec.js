const InfiValidator = require('../lib/validator');

describe('Validate request', () => {
    let req, validator;

    beforeEach(() => {
        req = {
            params: {
                userId: 1,
                docId: '5e8703d290165868e8c2cd50',
                wrongDocId: '5e8703d290165868e8c2cd50xxx'
            },
            body: {
                secureKey: {
                    token: 'yMl.123'
                },
                notSecureKey: {
                    $gt: ''
                }
            },
            query: {
                title: 'Research about secure Node.js apps',
                emptyTitle: '',
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

    it('detects No-SQL injection and sanitizes the body (body => notSecureKey)', () => {
        expect.assertions(1);

        const cleanBody = {
            secureKey: {
                token: 'yMl.123'
            },
            notSecureKey: {
                gt: ''
            }
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

    it('detects value is string (query => title)', () => {
        expect.assertions(1);

        validator
            .checkValues('query', {
                title: ['isString'],
            });

        const hasError = validator.hasErrors();
        expect(hasError).toBe(false);
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

    afterEach(() => {
        validator = null;
    });
});