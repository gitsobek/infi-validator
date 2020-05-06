# infi-validator

[![Build Status](https://travis-ci.org/gitsobek/infi-validator.svg?branch=master)](https://travis-ci.org/gitsobek/infi-validator)
![npm](https://img.shields.io/npm/v/infi-validator)
![NPM](https://img.shields.io/npm/l/infi-validator)
![David](https://img.shields.io/david/gitsobek/infi-validator)

This library is a specially targeted module for Express.js applications to validate and sanitize incoming requests with predefined helpers. It can be integrated with all kinds of frameworks and libraries. Specific functionality of this library can be used on simple or complex plain objects.

## Install

```
$ npm install infi-validator
```

## Usage

Include the library into your project, build a Express.js route handler and create an instance of the validator class. 

```javascript
const InfiValidator = require('infi-validator');

app.get('/login', function(req, res) {
    const validator = new InfiValidator(req);
    validator
        .checkValues('params', {
            id: 'isMongoId'
        });

    const hasError = validator.hasErrors();

    if (hasError) {
        const err = validator.getFirstError();
        return res.status(err.code).send({
            code: err.code,
            message: err.message
        });
    }

    // ...

});
```

Specify the path of the request object, list the properties included in the object and assign helpers to be run against the values of the specified properties.
Available paths are as follows:
- params
- body
- query

In order to check if the validator detected an invalid value, use the `hasErrors()` method. 
Based on the flag returned by this function, you can perform further operations like throwing an error or sending a response back to the client with automatically generated code and message from the template generator.

> Method `getFirstError()` returns error details containing code and message that were collected at the time of encountering the first incorrect value. You can also use `getErrors()` method to get all errors that were thrown during the validation check.

### Multiple validators on a single property

It is possible to run multiple validators against a single property by placing them into an array:

```javascript
validator
    .checkValues('params', {
        id: ['isExists', 'isMongoId']
    });
```

### Chainable validations

You can chain `checkValues()` together to validate several locations at once:

```javascript
validator
    .checkValues('params', {
        id: ['isExists', 'isMongoId']
    })
    .checkValues('body', {
        name: ['isExists', 'isString'],
        age: ['isExists', 'isNumber'],
        languages: 'isNotEmpty'
    });
```


### Sanitization

You can sanitize incoming requests by stripping off vulnerable keywords from properties and replacing their values to a sanitized form. The library examines values for `XSS` and `No-SQL Injection` occurrences.  

In order to sanitize incoming request, use the `cleanInjections()` method:

```javascript
/* 
{
    username: "admin",
    password: "<script>alert('xss');</script>",
    role: {
        $eq: {
            $ne: "not-not-admin"
        }
    }
}
*/

validator.cleanInjections();

const { body } = validator.getSafeObject();

console.log('is body safe?', body);
/* is body safe?
{
    username: "admin",
    password: "&lt;script&gt;alert('xss');&lt;/script&gt;",
    role: {
        eq: {
            ne: "not-not-admin"
        }
    }
}
*/
```

The sanitized body object is available on the `getSafeObject()` method call. As for the `cleanInjections()` method, it iterates over the data recursively and cleans off every encountered injection and vulnerability, thus you can continue to work on this object safely. 

## Tests

```
$ npm install
$ npm test
```

## Contribution
I encourage everyone to contribute to this project by extending the functionality, adding new features and validators. Before creating a pull request, please refer to the pull request guideline.

## Author

[Piotr Sobuś](https://www.linkedin.com/in/piotr-sobu%C5%9B-028627181/en)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
