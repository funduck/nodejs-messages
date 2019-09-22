# nodejs-messages
Message keeps data for logging and can be a context.  
Instead of making a string for log every time one can store data in an object that composes a string later only when needed.  
What if you have a code like this?

    logger.info('functionCall()')
    logger.verbose('arguments', ...args)
    ...
    logger.debug('result:', result)

If logger has level 'warn' we expect logger calls to be as fast as possible, all of them are *skipped* but we still pass several arguments. What about this line?

    logger.verbose(`let's print date: ${new Date()}`)

It calculates `Date` and converts it to string even if it will not be printed. Could we skip conversion? Yes, if we keep raw data and make strings only if we need them.  
Message stores data, when we *set* it there. When logger wants to print a Message it should call `toString`, for example trying to convert it to string like this

    String(message)

Then all logger calls will receive only one argument, and there will be conversion to string only if logger is really going to print that message.  

The fastest object to store data in JavaScript is a **Map**, so I extended it with
* setm - set multiple key-value pairs
* clone - make a copy and set multiple key-value pairs if arguments provided
* toString - make formatted string out of all keys except **starting with _** using [format](#format)  

## Example
It is always easier to start with example, so run this to see how Message can be used for logging

    node example.js

You will see

```
Example of Mesagges being used for logging
You should see below a logs table with columns: something like call stack id, something that answers the question "where?", something for "what?" and rest data in a "key=value" form

Case1: we call IntFactory.getEven() which results in only 1 function call in stack:
	muid559445	getEven		
	muid559445	getEven	OK	result=126

Case2: we call IntFactory.getOdd() which results in 2 function calls in stack:
	muid559446	getOdd		
	muid559446	getEven		
	muid559446	getEven	OK	result=126
	muid559446	getOdd	OK	result=127

printError()
	muid559446	printError	error	result=Error: error message for example
    at Object.<anonymous> (/home/oomilekh/dev/nodejs-messages/example.js:64:74)
    at Module._compile (module.js:652:30)
    at Object.Module._extensions..js (module.js:663:10)
    at Module.load (module.js:565:32)
    at tryModuleLoad (module.js:505:12)
    at Function.Module._load (module.js:497:3)
    at Function.Module.runMain (module.js:693:10)
    at startup (bootstrap_node.js:188:16)
    at bootstrap_node.js:609:3
```

## Usage
When processing any tasks usually you have some ID  
Make initial Message at the start

    const msg = new Message('requestId', task.ID)

Print it

    logger.debug(msg);

Or print it with additional info

    logger.debug(msg.clone('what', 'request accepted');

Later you can print it changing that info

    logger.debug(msg.clone('what', 'processing request');

You can some functions and pass task *context* in there  

    function F(inMsg, ...args) {
        // better don't change original Message
        const msg = inMsg.clone('where', 'inside F()');

        // print at start of a function
        logger.debug(msg.clone('what', 'start', 'args', args));

        // print in the middle
        logger.debug(msg.set('what', 'doing hard work'));

        // and in the end
        logger.debug(msg.set('what', 'result', 'result', {res: 'OK', error: null}));
    }

Pass a Message into a function call

    F(msg, ...)

## Message as a context
As we see above adding more parameters to functions doesn't look good, alternative is calling functions with `function.call()`  
We can pass a Message as **this** into function. For arrow functions we don't need that, they have all outer environment already.  
And Message can just store data, without printing it because **all keys starting with _ are not printed**  

    function F(...args) {
        // we have a Message and still use it for logging, but instead of argument "inMsg" we use "this"
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

Of course you can use Message as a context passing it as an argument, often it will be the only right way.

### Format
Format for printing is used globally in Messages object, its a restriction but will make all application logs look same which isn't a bad idea.  
Format object is

    {
        fields: [{
            name: "FIELD NAME",
            width: SPACE FOR A FIELD
        }, ...],
        elasticWidth: BOOLEAN,
        positionalSeparator: "STRING",
        otherSeparator: "STRING"
    }

Mentioned fields are positional and will be printed in order, according to format and without names, like this:

    muid123456 funcCall() begin

`format.positionalSeparator` is used to separate positional fields when `elasticWidth==false`, when `elasticWidth==true` space is used  

Fields not mentioned in format are printed after positional fields like this:

    key1=val1 key2=val2 ...

`format.otherSeparator` is used to separate these fields  

and JSON.stringify() is applied to all values except Errors, for them we print `.stack`

### Setting format

    Messages.setFormat({
        fields: [{
            name: 'muid',
            width: 12
        }, {
            name: 'where',
            width: 15
        }, {
            name: 'what',
            width: 23
        }],
        elasticWidth: true,
        positionalSeparator: '\t',
        otherSeparator: ' '
    })

That is actually a **default** format

### Space and elastic space
Positional fields will go in strict order within reserved space and if space is not enough field can borrow some from left neighbor  
For example if format is:

    {
        fields: [{
            name: 'where',
            width: 8
        }, {
            name: 'what',
            width: 9
        }, {
            name: 'detail',
            width: 6
        }],
        elasticWidth: true
    }

And Message are

    new Message('where', 'this', 'what', 'is_short', 'detail', 'string', 'k', 'v')
    new Message('where', 'this', 'what', 'is_longer', 'detail', 'string', 'k', {v: 1})

Then strings will be

    'this    is_short string k=v'
    'this   is_longer string k={"v":1}'

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

Check out [test](./test.js) and [example.js](./example.js) for more details
