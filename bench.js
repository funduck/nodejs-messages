'use strict';

const Benchmark = require('benchmark');
const Messages = require('./index');

const genArgs = function (S, N, J) {
    const args = new Array(2*(S + N + J));
    for (let i = 0; i < S; i++) {
        args[2*i] = i;
        args[2*i + 1] = String(Math.random());
    }
    for (let i = S; i < S + N; i++) {
        args[2*i] = i;
        args[2*i + 1] = Math.random();
    }
    for (let i = S + N; i < S + N + J; i++) {
        args[2*i] = i;
        args[2*i + 1] = {key: i, value: Math.random(), date: new Date()};
    }
    return args;
};

const args = function () {
    return genArgs(2, 2, 1);
}

const Test1 = function (callback) {
    Messages.setFormat({
        fields: [],
        elastic: false
    });

    console.error('Comparing pure console.log() printing:\n', ...args());
    console.error('with console.log(new Message()) printing:\n', new Messages.Message(...args()).toString());

    const suite = new Benchmark.Suite;
    // add tests
    suite.add('console.log(array of arguments)', function() {
        console.log(...args());
    })
    .add('console.log(new Message())', function() {
        console.log(new Messages.Message(...args()));
    })
    // add listeners
    .on('cycle', function(event) {
      console.error(String(event.target));
    })
    .on('complete', function() {
        console.error('Fastest is ' + this.filter('fastest').map('name'));
        if (callback) callback();
    })
    // run async
    .run({ async: true });
};

const Test2 = function (callback) {
    Messages.setFormat({
        fields: [{
            field: 0,
            len: 25
        }, {
            field: 1,
            len: 25
        }],
        elastic: true
    });

    console.error('Comparing pure console.log() printing:\n', ...args());
    console.error('with console.log(new Message()) printing:\n', new Messages.Message(...args()).toString());

    const suite = new Benchmark.Suite;
    // add tests
    suite.add('console.log(array of arguments)', function() {
        console.log(...args());
    })
    .add('console.log(new Message())', function() {
        console.log(new Messages.Message(...args()));
    })
    // add listeners
    .on('cycle', function(event) {
      console.error(String(event.target));
    })
    .on('complete', function() {
        console.error('Fastest is ' + this.filter('fastest').map('name'));
        if (callback) callback();
    })
    // run async
    .run({ async: true });
};

Test1(function () {
    console.error();
    Test2();
});
