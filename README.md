# nodejs-messages
## Messages keep data for logging and can be a context
Instead of writing text or composing a string for log every time one can store data in an object that can compose a string later when needed.  
The fastest object to store data in JavaScript is a **Map**, so I extended it with
* setm - set multiple key-value pairs
* clone - make a copy and set multiple key-value pairs
* toString - make formatted string out of all keys except **starting with _**  

### Message not unique id
It is useful to track log messages for one call stack, so if [format](#format) contains field **muid** then quasi unique id will be generated for every `new Message()`  
**muid** can be printed only as positional field  
It is NOT UNIQUE to be shorter, if a really unique id is required use **rmuid** but it will be generated only for Messages created after format is set and generator is not perfect.

## Format
Format object is

    {
        fields: [{
            field: "FIELD NAME",
            len: SPACE FOR A FIELD
        }, ...],
        elastic: BOOLEAN
    }
Fields not mentioned in format are printed like this:

    key1=val1 key2=val2 ...

JSON.stringify() is applied to values

### Setting format
    Messages.setFormat({
        fields: [{
            field: 'muid',
            len: 12
        }, {
            field: 'where',
            len: 15
        }, {
            field: 'what',
            len: 23
        }],
        elastic: true
    })

That is actually a **default** format

### Space and elastic space
Positional fields will go in strict order within reserved space and if space is not enough field can borrow some from left neighbor
For example if format is:

    {
        fields: [{
            field: 'where',
            len: 8
        }, {
            field: 'what',
            len: 9
        }, {
            field: 'detail',
            len: 6
        }],
        elastic: true
    }

And Message are

    new Message('where', 'this', 'what', 'is_short', 'detail', 'string', 'k', 'v')
    new Message('where', 'this', 'what', 'is_longer', 'detail', 'string', 'k', {v: 1})

Then strings will be

    'this    is_short string k=v'
    'this   is_longer string k={"v":1}'

## Usage
For example, processing tasks it is important to print some ID
Make initial Message at the start

    const msg = new Message('requestId', task.ID)

Print it

    logger.debug(msg);

Or print it with additional info

    logger.debug(msg.clone('what', 'accepted');

Later you can print it changing that info

    logger.debug(msg.clone('what', 'processing');

Call some functions and have task *context* in there  
Pass a Message and add more data to it

    function F(inMsg, ...args) {
        // better don't change original Message
        const msg = inMsg.clone('where', 'inside F()');

        // print at start of a function
        logger.debug(msg.clone('what', 'start', 'args', args));

        // print in the middle
        logger.debug(msg.set('what', 'processing'));

        // and in the end
        logger.debug(msg.set('what', 'result', 'result', {res: 'OK', error: null}));
    }

## Message as a context
As we see above adding more parameters to functions doesn't look good, alternative is calling functions with `f.call()`  
This way we can pass a Message into **this** in a function. For arrow functions we don't need that, we have all outer environment already.    
And Message can just store data, without printing it, **all keys starting with _ are not printed**  

    function F(...args) {
        // we have a Message and still use it for logging
        const msg = this.clone('where', 'inside F()');
        logger.debug(msg);

        // And we can get context variables
        msg.get('_dateStarted')
        msg.get('_dateExpired')
        msg.get('_')
    }

    const msg = new Message('requestId', task.ID, '_dateStarted': new Date(), '_dateExpired': new Date(), '_': {anything});
    F.call(msg, ...args);
    // instead of F(...args);

## More

Check out **test** for details
