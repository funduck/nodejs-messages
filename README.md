# nodejs-messages
## Messages keep data for logging and can be a context

Instead of writing text or composing a line for log one can store data in an object that can compose a string later when needed. The fastest object to store data in nodejs is a **Map**, so I extended it with
* setm - set multiple key-value pairs
* clone - make a copy and set multiple key-value pairs
* toString - make a string out of all keys except **starting with _**  

## Usage
For example, processing tasks it is important to print some ID
Make initial Message at the start

    const msg = new Message('requestId', task.ID);

Then print it with additional info

    logger.debug(msg.clone('what', 'accepted');

Further you can print it changing that info

    logger.debug(msg.clone('what', 'processing');

Call some functions and have *context* there, so pass a Message and inside you can add to a Message more data

    function F(inMsg, ...args) {
        const msg = inMsg.clone('where', 'F');
        // at start of a function
        logger.debug(msg.clone('what', 'start', 'args', args));
        // then
        logger.debug(msg.set('what', 'processing'));
        // and in the end
        logger.debug(msg.set('what', 'result', 'result', {res: 'OK', error: null}));
    }

## Passing context
Adding more parameters to functions doesn't look good, but you could use **this** to pass a Message  
And Message can just store data, without printing it, **all keys starting with _ are not printed**  

    function F(...args) {
        const msg = this.clone('where', 'F');
        logger.debug(msg.set('what', 'start'));
        ...
        logger.debug(msg.set('what', 'processing'));
        ...
        logger.debug(msg.set('what', 'result', 'result', {res: 'OK', error: null}));
    }
    ...
    const msg = new Message('requestId', task.ID, '_dateStarted': new Date(), '_dateExpired': new Date(), '_': {anything});
    F.call(msg, ...args);

## Formatting
Default printing is

    key1=val1 key2=val2 ...

Messages allow reserve space for some fields, they will go in strict order and if space is not enough fields can borrow some from left neighbor

    "this    is_short string"
    "this   is_longer string"
