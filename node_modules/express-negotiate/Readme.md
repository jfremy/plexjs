
# express-negotiate

  Express content negotiation functions.

## Installation

    $ npm install express-negotiate

## Usage

Require the module to add the request.negotiate method:

```javascript
var express = require('express')
    , negotiate = require('express-negotiate');
```

Then use in the route handler:

```javascript
app.get('/index', function(req, res, next) {
    req.negotiate({
          'application/json': function() {
            res.send('{ message: "Hello World" }');
        }
        , 'html': function() {
            res.send('<html><body><h1>Hello World</h1></body></html>');
        }
        , 'default': function() {
            // send HTML anyway
            res.send('<html><body><h1>Hello World</h1></body></html>');
        }
    });
});
```

Each handler key is either a full mimetype string, or a file extension string.

## Specifiying priority

When multiple handlers are acceptable for satisfying the request, then any may
be used the request (it is typically the first specified, however this is
dependent on the javascript engine implementation).

To prioritise handlers, simply append a quality in the same notation as the
client uses when specifying an Accept header:

```javascript
app.get('/index', function(req, res, next) {
    req.negotiate({
          'application/json;q=0.9': function() {
            res.send('{ message: "Hello World" }');
        }
        , 'application/html;q=1.1': function() {
            res.send('<html><body><h1>Hello World</h1></body></html>');
        }
        , 'default': function() {
            // send HTML anyway
            res.send('<html><body><h1>Hello World</h1></body></html>');
        }
    });
});
```

Note that the handler priority is only used after the priorities specified
by any Accept header in the request have been considered.  A priority cannot be
specified on the 'default' handler.

## Combining handlers

When the same handler can be used for multiple types, then they can be
combined in the string:

```javascript
app.get('/index', function(req, res, next) {
    req.negotiate({
          'application/json;q=0.9': function() {
            res.send('{ message: "Hello World" }');
        }
        , 'html;q=1.1,default': function() {
            res.send('<html><body><h1>Hello World</h1></body></html>');
        }
    });
});
```

## Handling unacceptable requests

If there are no acceptable handlers, and no 'default' handler is specified,
then req.negotiate will throw a negotiate.NotAcceptable error.  This can be
caught and handled using express error handling:

```javascript
app.get('/index', function(req, res, next) {
    req.negotiate({
          'application/json': function() {
            res.send('{ message: "Hello World" }');
        }
    });
});

app.error(function(err, req, res, next) {
    if (err instanceof negotiate.NotAcceptable) {
        res.send('Sorry, I dont know how to return any of the content types requested', 406);
    } else {
        next(err);
    }
});
```

In some cases, it is preferable to call next(err) rather than throw an error.
If negotiate is passed the 'next' callback function, it will call that
instead:

```javascript
app.get('/index', function(req, res, next) {
    req.negotiate(next, {
          'application/json': function() {
            res.send('{ message: "Hello World" }');
        }
    });
});
```

## Allowing route filename extensions to override Accept header

By parsing out any filename extension on the route, and passing
this to req.negotiate, the client can force a particular
Content-Type regardless of the Accept header.

```javascript
app.get('/index.:format?', function(req, res, next) {
    req.negotiate(req.params.format, {
          'application/json': function() {
            res.send('{ message: "Hello World" }');
        }
    });
});
```

Picking up the filename extension on a "catch-all" route is a little trickier.
The following example uses a regex to achieve this:

```javascript
app.get(/^.*?(?:\.([^\.\/]+))?$/, function(req, res) {
    req.negotiate(req.params[0], {
          'json;q=0.9': function() {
            res.send({ error: 404, message: 'Not Found' }, 404);
        }
        , 'html;q=1.1,default': function() {
            res.statusCode = 404;
            res.send('<html><body><h1>Not Found</h1></body></html>');
        }
    });
});
```

## License

(The MIT License)

Copyright (c) 2011 Chris Leishman &lt;chris@leishman.org&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
