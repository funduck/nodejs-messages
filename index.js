'use strict';

/*
    Context holder
    Keeps key-value pairs
    has toString() so can be used for logging
    has clone() so can be nested in subroutines
    to be used as "context" keys starting with "_" are not used in toString()
*/
class Message extends Map {
    constructor (...args) {
        // new(otherMessage) -- clone or raw init
        if (args[0] instanceof Map || args[0] instanceof Message || Array.isArray(args[0])) {
            super(...args);
        } else {
            super();
        }

        // new('key1', 'val1', 'key2', val2', ...)
        if (args.length > 1) {
            this.setm(...args);
        }

        // message universal id - quasi unique message identificator, great to track log messages in call stack
        if (Messages.useMUID && !this.get('muid')) {
            this.set('muid', Messages._getNextMUID());
        }

        // real message universal id - 
        if (Messages.useRMUID && !this.get('rmuid')) {
            this.set('rmuid', Messages._getNextRMUID());
        }
    }

    /**
    Set multiple key-value pairs, for example: setm('a', 1, 'b', 2, 'c', 3)
    @param {...string|number|object|function} args
    @return {Message}
    */
    setm (...args) {
        if (args.length == 0) return this;

        if (args.length % 2 == 0) {
            for (let i = 0; i < args.length/2; i++) {
                this.set(args[2*i], args[2*i + 1]);
            }
        } else {
            throw new Error('number of arguments must be multiple of 2')
        }

        return this;
    }

    /**
    Converts to string
    Uses all keys except starting with "_"
    First prints positional fields from Messages._format, then all key-value pairs separated with space
    @return {string} 
    */
    toString () {
        let key;
        let val;
        let width;
        let s = '';
        let free = 0;
        let spaceBefore;
        const format = Messages._format;
        
        // positional fields
        const fields = format.fields;
        for (let i = 0; i < fields.length; i++) {
            key = fields[i].name;
            val = String(this.get(key) || '');

            if (format.elasticWidth) {
                width = fields[i].width;
                if (val.length < width) {
                    spaceBefore = ''.padEnd(free, ' ');
                    free = width - val.length;
                } else {
                    if (i > 0) {
                        spaceBefore = ' '.padEnd(free - val.length + width);
                    } else {
                        spaceBefore = '';
                    }
                    free = 0;
                }
                s += spaceBefore + val;
            } else {
                s += val + format.positionalSeparator;
            }
        }
        
        if (fields.length && format.elasticWidth) {
            if (free) {
                s += ''.padEnd(free, ' ');
            } else {
                s += format.otherSeparator;
            }
        }
        
        // other fields
        let separator = '';
        for (let [key, val] of this) {
            if (
                // keys like "_withUnderscore" are not serialized
                (!key.match || !key.match(/^_/)) &&
                
                // muid is positional
                key != 'muid' &&
                
                // rmuid is positional
                key != 'rmuid' &&
                
                // other positional
                !format.fieldNamesMap.get(key) &&
                
                val != null
            ) {
                let valString;
                if (val instanceof Error) {
                    valString = val.stack;
                } else {
                    valString = JSON.stringify(val);
                }
                s += separator + key + '=' + valString;
                separator = format.otherSeparator;
            }
        }
        return s;
    }

    /**
    Clone
    @return {Message}
    */
    clone (...args) {
        const clone = new Message(this);
        if (args.length > 0) {
            clone.setm(...args);
        }
        return clone;
    };
};

const Messages = {
    Message: Message,
    
    useMUID: false,

    useRMUID: false,

    _getNextMUID: function () {
        return  'muid' + new Date().getTime() % 1000000;
    },

    _getNextRMUID: function () {
        return  'rmuid' + new Date().getTime();
    },

    _format: {
        // formatting for positional fields: order and width
        fields: [{
            name: 'where',
            width: 15
        }, {
            name: 'what',
            width: 23
        }],
        
        // map of field names
        fieldNamesMap: new Map([['where', true], ['what', true]]),
        
        // should fields have fixed width or it can be adjusted
        elasticWidth: true,
        
        positionalSeparator: '\t',
        
        otherSeparator: ' '
    },

    // TODO if needed _hiddenFields: new Map(),

    setFormat: function (format) {
        const _f = {
            fields: format.fields,
            fieldNamesMap: new Map(),
            elasticWidth: format.elasticWidth != null ? format.elasticWidth : true,
            positionalSeparator: format.positionalSeparator || '\t',
            otherSeparator: format.otherSeparator || ' ',
        };
        for (let i = 0; i < format.fields.length; i++) {
            _f.fieldNamesMap.set(format.fields[i].name, true);
            
            // min field width for muid is 12
            if (format.fields[i].name == 'muid' && (format.fields[i].width || 0) < 12) {
                format.fields[i].width = 12;
            }
            
            // default width for any field is 10
            if (format.fields[i].width == null) {
                format.fields[i].width = 10;
            }
        }
        Messages._format = _f;

        Messages.useRMUID = false;
        if (Messages._format.fieldNamesMap.get('rmuid')) {
            Messages.useRMUID = true;
        }
        
        Messages.useMUID = false;
        if (Messages._format.fieldNamesMap.get('muid')) {
            Messages.useMUID = true;
        }
    },

    /*
    TODO if needed
    hide: function (fields) {

    },

    show: function (fields) {

    }
    */
};

// setting default format
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
    elasticWidth: true
});

module.exports = Messages;
