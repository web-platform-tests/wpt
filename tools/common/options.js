// DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER
//  
// Copyright (C) 2014, Cable Television Laboratories, Inc. & Skynav, Inc. 
//  
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice, this list
//   of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright notice, this list
//   of conditions and the following disclaimer in the documentation and/or other
//   materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
// PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
// THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";
var assert      = require('assert');
var fs          = require('fs');
var path        = require('path');
function mapOptionAlias(alias) {
    if (alias == 'config')
        alias = 'configFile';
    else if (alias == 'in')
        alias = 'inputFile';
    else if (alias == 'input')
        alias = 'inputFile';
    else if (alias == 'out')
        alias = 'outputFile';
    else if (alias == 'output')
        alias = 'outputFile';
    else
        alias = alias;
    return alias;
}
function readConfiguration(configFile, options, defaults) {
    var encoding = options['configFileEncoding'] || defaults['configFileEncoding'];
    var config = JSON.parse(fs.readFileSync(configFile, {encoding: encoding}));
    for (var name in config) {
        if (name in options)
            continue;
        else
            options[name] = config[name];
    }
    return options;
}
function processOptionDefaults(options, defaults) {
    for (var name in defaults) {
        if (name in options)
            continue;
        else
            options[name] = defaults[name];
    }
    return options;
}
function extractSpecDirectory(filePath) {
    return path.dirname(filePath);
}
function processSpecDirectoryOption(options, defaults) {
    if (!options['specDirectory']) {
        var configFile = options['configFile'];
        if (!!configFile)
            options['specDirectory'] = extractSpecDirectory(configFile);
        else if (!!options['inputFile'])
            options['specDirectory'] = extractSpecDirectory(options['inputFile']);
    }
    return options;
}
function processInputFileOption(options, other, defaults, handler) {
    return handler.processInputFileOption(options, other, defaults);
}
function processOutputFileOption(options, other, defaults, handler) {
    return handler.processOutputFileOption(options, other, defaults);
}
function processOptions(options, defaults, handler) {
    // merge configuration
    var configFile = options['configFile'];
    if (!!configFile)
        options = readConfiguration(configFile, options, defaults);
    // merge defaults
    options = processOptionDefaults(options, defaults);
    // specific option processing
    var other = options['other'];
    options = processSpecDirectoryOption(options, defaults);
    options = processInputFileOption(options, other, defaults, handler);
    options = processOutputFileOption(options, other, defaults, handler);
    return options;
}
function readOptions(argv, defaults, handler) {
    var options = {};
    assert(!!argv, 'missing argument array');
    assert(argv.length >= 2, 'missing argument');
    argv.shift();
    argv.shift();
    while (argv.length > 0) {
        var a1 = argv.shift();
        var name, value;
        if (a1.indexOf('--') == 0) {
            name = a1.substr(2);
            if (!name.length)
                break;
            else
                name = mapOptionAlias(name);
            if (argv.length > 0) {
                var a2 = argv.shift();
                if (a2.indexOf('--') == 0)
                    argv.unshift(a2);
                else if (a2.indexOf('\\--') == 0)
                    value = a2.substr(1);
                else
                    value = a2;
            }
        } else if (a1.indexOf('-') == 0) {
            switch (a1.substr(1)) {
            case 'v':
                name = 'verbose'; value = true;
                break;
            default:
                break;
            }
        } else {
            argv.unshift(a1);
            break;
        }
        if (name !== undefined) {
            options[name] = value;
        }
    }
    if (argv.length > 0) {
        var other = [];
        while (argv.length > 0) {
            other.push(argv.shift());
        }
        options['other'] = other;
    }
    return processOptions(options, defaults, handler);
}
exports.extractSpecDirectory = function(filePath) {
    return extractSpecDirectory(filePath);
}
exports.readOptions = function(argv, defaults, handler) {
    return readOptions(argv, defaults, handler);
}
