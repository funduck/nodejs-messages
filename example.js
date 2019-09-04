const Messages = require('./index');
const Message = Messages.Message;

Messages.setFormat({
    fields: [{
        name: 'pid',
        width: 10
    }, {
        name: 'muid',
        width: 10
    }, {
        name: 'where',
        width: 30
    }, {
        name: 'what',
        width: 30
    }],
    elasticWidth: false
});

logger = {
    log: (...args) => {
        s = '';
        args.forEach((a) => {
            s += String(a);
        })
        console.log(s);
    }
}

const IntFactory = {
    getOdd: function (msg) {
        if (!msg) msg = new Message();
        const _msg = msg.clone('where', 'getOdd');
        logger.log(_msg);
        const res = IntFactory.getEven(_msg) + 1;
        logger.log(_msg.setm('what', 'OK', 'result', res));
        return res;
    },
    
    getEven: function (msg) {
        if (!msg) msg = new Message();
        const _msg = msg.clone('where', 'getEven');
        logger.log(_msg);
        const res = parseInt(Math.random() * 100, 10) * 2;
        logger.log(_msg.setm('what', 'OK', 'result', res));
        return res;
    }
};

logger.log('IntFactory.getEven() with only 1 function call in stack:');
IntFactory.getEven();

logger.log('\nIntFactory.getOdd() with 2 function calls in stack:');
IntFactory.getOdd();

logger.log('\nprintError()');
logger.log(new Message('where', 'printError', 'what', 'error', 'result', new Error('error message for example')));
