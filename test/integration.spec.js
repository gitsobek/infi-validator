const express = require('express');
const request = require('supertest');

const InfiValidator = require('../lib/validator');

describe('Validator integrated with Express.js', () => {
    let app, server;

    beforeAll(() => {
        app = express();
        server = app.listen(3000);
    });

    beforeEach(() => {
        app.use(express.json());
        app.post('/', function (req, res) {
            const validator = new InfiValidator(req);
            validator
                .checkValues('body', {
                    id: ['isExists', 'isNumber'],
                    username: 'isString'
                })
                .cleanInjections();

            const { body } = validator.getSafeObject();

            res.status(201).send({
                message: 'Object has been sanitized successfully.',
                data: body
            })
        });
    });

    it('sends a No-SQL vulnerable request body and returns sanitized data', async () => {
        expect.assertions(3);

        const body = {
            id: 123,
            username: "John",
            password: "<script>alert('xss');</script>",
            role: {
                $eq: {
                    $ne: "not-not-admin"
                }
            },
            someProperty: 123,
            someArray: [
                "<script>alert('xss');</script>",
                123,
                {
                    $eq: "<script>alert('xss');</script>"
                },
                "<script>alert('xss');</script>"
            ],
            importantField: "<script>alert('xss');</script>"
        };

        const res = await request(app)
            .post('/')
            .send(body)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json');

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toEqual('Object has been sanitized successfully.');
        expect(res.body.data).toEqual({
            id: 123,
            username: 'John',
            password: "&lt;script&gt;alert('xss');&lt;/script&gt;",
            role: {
                eq: {
                    ne: 'not-not-admin'
                }
            },
            someProperty: 123,
            someArray: [
                "&lt;script&gt;alert('xss');&lt;/script&gt;",
                123,
                {
                    eq: "&lt;script&gt;alert('xss');&lt;/script&gt;"
                },
                "&lt;script&gt;alert('xss');&lt;/script&gt;"
            ],
            importantField: "&lt;script&gt;alert('xss');&lt;/script&gt;"
        });
    });

    afterAll(() => {
        server.close();
    });
});
