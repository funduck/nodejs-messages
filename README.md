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

## Benchmark
Compared on my laptop to `console.log` it is slower but not dramatically `80,195 ops/sec VS 96,897 ops/sec`

    Comparing pure console.log() printing:
    0 0.967876549678572 1 0.5166329325932508 2 0.49092531557067565 3 0.8750981266344764 4 { key: 4,
    value: 0.09689954539560874,
    date: 2019-01-26T14:38:43.747Z }
    with console.log(new Message()) printing:
    0="0.6924179197953284" 1="0.46192706643019643" 2=0.5539190945036634 3=0.6895393555604648 4={"key":4,"value":0.22099125880656678,"date":"2019-01-26T14:38:43.749Z"}
    console.log(array of arguments) x 96,451 ops/sec ±1.54% (84 runs sampled)
    console.log(new Message()) x 80,223 ops/sec ±0.69% (89 runs sampled)
    Fastest is console.log(array of arguments)

    Comparing pure console.log() printing:
    0 0.7257643828952878 1 0.9633743632909522 2 0.08541227165710619 3 0.7190222820259451 4 { key: 4,
    value: 0.4385622363869133,
    date: 2019-01-26T14:38:56.047Z }
    with console.log(new Message()) printing:
    0.12645777701909733      0.9914773008978446        2=0.20228763034523944 3=0.5483237610610716 4={"key":4,"value":0.21385680282745057,"date":"2019-01-26T14:38:56.047Z"}
    console.log(array of arguments) x 96,897 ops/sec ±0.62% (90 runs sampled)
    console.log(new Message()) x 80,195 ops/sec ±0.73% (93 runs sampled)
    Fastest is console.log(array of arguments)

## More

Check out **test** for details
