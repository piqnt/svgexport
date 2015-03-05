/*
 * svgexport
 * Copyright (c) 2015 Ali Shakiba
 * Available under the MIT license
 * @license
 */

try {
  var webpage = require('webpage');
  var async = require('async');
  var system = require('system');
  var resize = require('./resize');

  if (phantom.args.length !== 1) {
    exit('Error: Invalid commands!');
  }
  exec(JSON.parse(phantom.args[0]), exit);
} catch (e) {
  exit(e);
}

function exit(err) {
  err && system.stderr.writeLine(err);
  phantom.exit(err ? 1 : 0);
}

function exec(commands, done) {

  commands = Array.isArray(commands) ? commands : [ commands ];
  async.each(commands, function(cmd, done) {
    var page = webpage.create();
    try {
      var svgfile = cmd.input[0];
      var imgfile = cmd.output[0];
      var params = [].concat(cmd.input.slice(1), cmd.output.slice(1));
    } catch (e) {
      done && done(e);
      return;
    }
    page.open(svgfile, function(status) {
      if (status !== 'success') {
        var err = 'Error: Unable to load file (' + status + '): ' + svgfile;
        done && done(err);
        return;
      }
      try {
        var viewbox = page.evaluate(function() {
          var el = document.documentElement;
          if (el.getAttribute('width') && el.getAttribute('height')) {
            return {
              left : 0,
              top : 0,
              width : el.width.animVal.value,
              height : el.height.animVal.value
            };
          }
          var box = el.getAttribute('viewBox') ? el.viewBox.animVal : el
              .getBBox();
          return {
            more : el.getBBox(),
            left : box.x,
            top : box.y,
            width : box.width,
            height : box.height
          };
        });
        var output = resize.parse(viewbox, params, imgfile);
        page.clipRect = output;
        page.zoomFactor = output.scale;
      } catch (e) {
        done && done(e);
        return;
      }
      setTimeout(function() {
        try {
          page.render(imgfile, {
            format : output.format,
            quality : output.quality
          });
          system.stdout.writeLine(svgfile + ' ' + imgfile + ' '
              + output.toString());
          done && done();
        } catch (e) {
          done && done(e);
        }
      }, 0);
    });
  }, function(err) {
    done && done(err);
  });
}