/*
 * Svgexport
 * Copyright (c) 2017 Ali Shakiba
 * Available under the MIT license
 */

var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var phantomjs = require('phantomjs2');

function cli(args) {
    if (args.length === 1 && /.(js|json)$/i.test(args[0])) {
        render(path.resolve(process.cwd(), args.shift()), process);
        return;
    }

    if (args.length > 1) {
        render({
            input: [args.shift()],
            output: [args],
            cwd: process.cwd()
        }, process);
        return;
    }

    if (!args.length || (args.length === 1 && /(-h|--help|help)$/i.test(args[0]))) {
        try {
            console
                .log(fs.readFileSync(path.resolve(__dirname, 'README.md'), 'utf8')
                .match(/```usage([\s\S]*?)```/i)[1].replace(/\nsvgexport/,
                    '\nUsage: svgexport').replace(/\nsvgexport/g, '\n  or:  svgexport'));
        } catch (e) {
            console.log('Off-line `svgexport` help is not available!');
        }

        return;
    }

    console.error('Error: Invalid usage!');
}

function render(data, done) {
    // Current working dir
    var cwd;

    // Commands
    var commands = [];

    // Input/output
    var stdio = done;
    var stdout = stdio && stdio.stdout ? function (data) {
        stdio.stdout.write(data);
    } : noop;
    var stderr = stdio && stdio.stderr ? function (data) {
        stdio.stderr.write(data);
    } : noop;

    done = typeof done === 'function' ? done : noop;

    // Datafile
    if (typeof data === 'string') {
        data = path.resolve(process.cwd(), data);
        cwd = path.dirname(data);
        try {
            data = require(data);
        } catch (e) {
            var err = 'Error: Invalid data file: ' + data + '\n';
            stderr(err);
            return done(err);
        }
    } else {
        cwd = data.cwd || data.base || process.cwd();
    }

    // Parse input
    data = Array.isArray(data) ? data : [data];
    data.forEach(function (entry) {
        var input = entry.src || entry.input;
        var outputs = entry.dest || entry.output;

        // TODO: Use /('[^']*'|"[^"]*"|[^"'\s])/ instead of split(/\s+/)

        // Make sure input is array
        if (Array.isArray(input) === false) {
            input = input.split(/\s+/);
        }

        // Resolve input path if needed
        if (path.isAbsolute(input[0]) === false) {
            input[0] = path.resolve(cwd, input[0]);
        }

        // Make sure outputs is array
        if (Array.isArray(outputs) === false) {
            // Single line
            outputs = [outputs.split(/\s+/)];
        } else {
            // Array, but not 2d array
            outputs = outputs.map(function (output) {
                if (!Array.isArray(output)) {
                    return output.split(/\s+/);
                }
                return output;
            });
        }

        // Temporary fix for phantomjs+windows
        if (/^[a-zA-Z]:\\/i.test(input[0])) {
            input[0] = 'file:///' + input[0];
        }

        outputs.forEach(function (output) {
            // Resolve output path if needed
            if (path.isAbsolute(output[0]) === false) {
                output[0] = path.resolve(cwd, output[0]);
            }

            commands.push({
                input: input,
                output: output
            });
        });
    });

    // Convert commands to JSON
    commands = JSON.stringify(commands);

    // Spawn PhantomJS
    var cp = child_process.spawn(phantomjs.path, [path.resolve(__dirname, 'render.js'), commands]);
    var errors = [];

    // Handle input/output
    cp.stdout.on('data', function (data) {
        if (data) {
            stdout(data);
        }
    });
    cp.stderr.on('data', function (data) {
        if (data) {
            stderr(data);
            errors.push(data.toString());
        }
    });

    // Handle exit
    cp.on('exit', function (code) {
        if (code) {
            done(code && errors.join('\n'));
            return;
        }

        done(errors.join('\n'));
    });
}

function noop() {
    // Nope.
}

// Exports
module.exports.render = render;
module.exports.cli = cli;
