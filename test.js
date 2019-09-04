const Messages = require('./index');
const Message = Messages.Message;
const assert = require('assert');

describe('Messages', function() {
    it('new, setm and clone', () => {
        const m = [];
        m[1] = new Message().set('a', 1).set('b', 2);
        m[2] = new Message().setm('a', 1, 'b', 2);
        m[3] = new Message('a', 1, 'b', 2);
        m[4] = new Message().clone('a', 1, 'b', 2);
        for (let i = 1; i < 5; i++) {
            assert.equal(m[i].get('a'), 1);
            assert.equal(m[i].get('b'), 2);
        }
    });

    it('clone does not affect origin and vice versa', () => {
        const m1 = new Message('a', 1);
        const m2 = new Message(m1);

        assert.equal(m2.get('a'), 1);
        m1.set('a', 2);
        assert.equal(m2.get('a'), 1);
        m2.set('a', 3);
        assert.equal(m1.get('a'), 2);

        m1.set('b', 4);
        assert.equal(m2.get('b'), null);
        m2.set('c', 5);
        assert.equal(m1.get('c'), null);

        const m3 = m1.clone('d', 5, 'e', 6);
        assert.equal(m1.get('d'), null);
        assert.equal(m3.get('d'), 5);
        assert.equal(m1.get('e'), null);
        assert.equal(m3.get('e'), 6);
    });

    it('toString', () => {
        Messages.setFormat({
            fields: [{
                name: 'a',
                width: 3
            }, {
                name: 'b',
                width: 15
            }],
            elasticWidth: true
        });
        const m = new Message('a', 1, 'b', {bar: 'foo'}, 'c', {cat: 'meow'});
        assert.equal(m.toString(), '1  [object Object] c={"cat":"meow"}');
    });

    it('elasticWidth formatting in toString', () => {
        Messages.setFormat({
            fields: [{
                name: 'a',
                width: 3
            }, {
                name: 'b',
                width: 3
            }],
            elasticWidth: true
        });
        const m = new Message('a', 1, 'b', '123', 'c', 0);
        assert.equal(m.toString(), '1  123 c=0');
        m.set('b', '1234');
        assert.equal(m.toString(), '1 1234 c=0');
    });
    
    it('not elasticWidth formatting in toString', () => {
        Messages.setFormat({
            fields: [{
                name: 'a',
                width: 3
            }, {
                name: 'b',
                width: 3
            }],
            elasticWidth: false,
            positionalSeparator: '\t',
            otherSeparator: ' '
        });
        const m = new Message('a', 1, 'b', '123', 'c', 0, 'd', 1);
        assert.equal(m.toString(), '1\t123\tc=0 d=1');
        m.set('b', '1234');
        assert.equal(m.toString(), '1\t1234\tc=0 d=1');
    });

    it('toString omits keys starting with "_"', () => {
        Messages.setFormat({
            fields: [{
                name: 'a',
                width: 3
            }, {
                name: 'b',
                width: 15
            }],
            elasticWidth: true
        });
        const m = new Message('a', 1, 'b', {bar: 'foo'}, 'c', {cat: 'meow'}, '_p', 3.14);
        assert.equal(m.toString(), '1  [object Object] c={"cat":"meow"}');
    });

    it('toString prints "muid" if format has it', () => {
        Messages.setFormat({
            fields: [{
                name: 'muid'
            }, {
                name: 'a',
                width: 3
            }, {
                name: 'b',
                width: 15
            }],
            elasticWidth: true
        });
        const m = new Message('a', 1, 'b', {bar: 'foo'}, 'c', {cat: 'meow'}, '_p', 3.14);
        const re = new RegExp('^muid......  1  \\[object Object\\] c={"cat":"meow"}$');
        assert(m.toString().match(re) != null, '"' + m.toString() + '" not matches "' + re + '"');
    });
    
    it('toString prints Error stack', () => {
        Messages.setFormat({
            fields: [],
            elasticWidth: false
        });
        const m = new Message('result', new Error('sample error'));
        const re = new RegExp('result=Error: sample error');
        assert(m.toString().match(re) != null, '"' + m.toString() + '" not matches "' + re + '"');
    });
});
