/*
 * svgexport
 * Copyright (c) 2016 Ali Shakiba
 * Available under the MIT license
 * @license
 */

var puppeteer = require("puppeteer");
var async = require('async');
var path = require('path');
var resize = require('./resize');

module.exports.renderSvg = renderSvg;

async function renderSvg(commands, done, stdout) {

  // Make sure the commands var is an array.
  commands = Array.isArray(commands) ? commands : [ commands ];

  var browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--font-render-hinting=none']
  });

  // Run each command in parallel.
  await async.each(commands, async function(cmd) {

    var page = await browser.newPage();

    if (process.env.SVGEXPORT_TIMEOUT) {
      await page.setDefaultNavigationTimeout(Number(process.env.SVGEXPORT_TIMEOUT) * 1000);
    }

    var svgfile = cmd.input[0].split(path.sep)
      .map((pathPart) => encodeURI(pathPart))
      .join(path.sep);
    var imgfile = cmd.output[0];
    var params = [].concat(cmd.input.slice(1), cmd.output.slice(1));

    await page.goto('file://' + svgfile)
      .catch(function(e) {
        throw 'Unable to load file (' + e + '): ' + svgfile;
      }
    );

    var input = await page.evaluate(function() {

      var el = document.documentElement;
      var widthAttr = el.getAttribute('width');
      var heightAttr = el.getAttribute('height');
      var viewBoxAttr = el.getAttribute('viewBox');

      if (widthAttr && heightAttr && !/\%\s*$/.test(widthAttr)
          && !/\%\s*$/.test(heightAttr)) {
        return {
          size : true,
          left : 0,
          top : 0,
          width : el.width.animVal.value,
          height : el.height.animVal.value
        };
      } else if (viewBoxAttr && el.viewBox) {
        return {
          viewbox : true,
          left : el.viewBox.animVal.x,
          top : el.viewBox.animVal.y,
          width : el.viewBox.animVal.width,
          height : el.viewBox.animVal.height
        };
      } else {
        var box = el.getBBox();
        return {
          bbox : true,
          left : box.x,
          top : box.y,
          width : box.width,
          height : box.height
        };
      }
    });

    var output = new Command(input, params, imgfile);

    if (output.css) {
      await injectCSS(page, output.css);
    }

    var clip = {
      x: output.left - input.left * output.scale,
      y: output.top - input.top * output.scale
    };

    await page.evaluate(function(input, output, clip) {

      var svg = document.getElementsByTagName('svg')[0];

      if (!input.viewbox && !svg.getAttribute('viewBox')) {
        svg.setAttribute('viewBox', '0 0 ' + input.width + ' ' + input.height);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      }

      svg.removeAttribute('width');
      svg.removeAttribute('height');

      svg.style.setProperty('margin', 0, 'important');
      svg.style.setProperty('border', 0, 'important');
      svg.style.setProperty('padding', 0, 'important');

      svg.style.setProperty('position', 'fixed', 'important');

      if (clip.x < 0) {
        svg.style.setProperty('left', Math.abs(clip.x) + 'px', 'important');
      } else {
        svg.style.setProperty('left', 0, 'important');
      }

      if (clip.y < 0) {
        svg.style.setProperty('top', Math.abs(clip.y) + 'px', 'important');
      } else {
        svg.style.setProperty('top', 0, 'important');
      }

      svg.style.setProperty('width', (input.width * output.scale) + 'px', 'important');
      svg.style.setProperty('height', (input.height * output.scale) + 'px',  'important');

    }, input, output, clip);

    var svgContent = await page.content();

    clip.x = Math.max(clip.x, 0);
    clip.y = Math.max(clip.y, 0);

    var renderContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>svg</title>
        </head>
        <body
          style="
            margin: 0 !important;
            border: 0 !important;
            padding: 0 !important;
          ">
          <div id="svgExportOutput-fa5ce2b6d16510"
           style="
            margin: 0 !important;
            border: 0 !important;
            padding: 0 !important;
            position: fixed !important;
            left: ${clip.x}px !important;
            top: ${clip.y}px !important;
            width: ${output.width}px !important;
            height: ${output.height}px !important;
            "
          ></div>
          ${svgContent}
        </body>
      </html>
    `;

    await page.goto('about:blank');
    await page.setContent(renderContent);

    var renderSettings = {
      path: imgfile,
      type: output.format,
      omitBackground: true
    };

    if (output.format === 'jpeg') {
      renderSettings.quality = output.quality;
    }

    var outputEl = await page.$('#svgExportOutput-fa5ce2b6d16510');
    await outputEl.screenshot(renderSettings);

    stdout(svgfile + ' ' + imgfile + ' ' + output.toString() + '\n');

  }, async function(err) {
    await browser.close();
    done(err ? String(err) + '\n': undefined);
  });
}

async function injectCSS(page, css) {
  await page.evaluate(function(css) {
    var ns = "http://www.w3.org/2000/svg";
    var style = document.createElementNS(ns, "style");
    style.setAttribute('type', 'text/css');
    style.appendChild(document.createCDATASection(css));
    var svg = document.documentElement;
    svg.insertBefore(style, svg.firstChild);
  }, css);
}

function Command(input, params, outputfile) {

  params = new Params(params);

  var output = this;

  output.scale = 1;
  output.format = 'png';
  output.quality = 100;
  output.mode = 'crop'; // slice

  params.first(/^(\d+)\%$/i, function(match) {
    output.quality = parseInt(match[1]);
  });

  params.first(/^(jpeg|jpg)$/i, function(match) {
    output.format = match[1];
  }, function() {
    if (outputfile) {
      var ext = /.(jpeg|jpg)$/.exec(outputfile);
      if (ext && ext[1]) {
        output.format = ext[1];
      }
    }
  });

  output.format = output.format.toLowerCase().replace('jpg', 'jpeg');

  // output
  params.last(/^([0-9.]+)x$/i, function(match) {
    // <scale>x
    output.scale = parseFloat(match[1]);

  }) || params.last(/^(\d+):$/i, function(match) {
    // <width>:
    output.width = parseInt(match[1]);

  }) || params.last(/^:(\d+)$/i, function(match) {
    // :<height>
    output.height = parseInt(match[1]);

  }) || params.last(/^(\d+):(\d+)$/i, function(match) {
    // <width>:<height>
    output.width = parseInt(match[1]);
    output.height = parseInt(match[2]);
  });

  // input
  params.last(/^((-?\d+):(-?\d+):)?(\d+):(\d+)$/i, function(match) {
    input = {
      left : parseInt(match[2]) || 0,
      top : parseInt(match[3]) || 0,
      width : parseInt(match[4]),
      height : parseInt(match[5])
    };
  });

  // crop mode
  params.first(/^(pad|meet)$/i, function(match) {
    output.mode = 'pad';
  });

  // css style
  params.first(/^([^{}]+\s*\{[^{}]*\}\s*)+$/i, function(match) {
    output.css = match[0];
  });

  var resized = resize(input, output);
  this.scale = resized.scale;
  this.width = resized.width;
  this.height = resized.height;
  this.left = resized.left;
  this.top = resized.top;
}

Command.prototype.toString = function() {
  return this.format + ' ' + this.quality + '%' + ' ' + this.scale + 'x' + ' '
      + strnum(this.left / this.scale) + ':' + strnum(this.top / this.scale)
      + ':' + strnum(this.width / this.scale) + ':'
      + strnum(this.height / this.scale) + ' ' + strnum(this.width) + ':'
      + strnum(this.height);
}

function Params(params) {
  this.first = function(regex, callback, fallback) {
    for (var i = 0; i < params.length; i++) {
      var param = params[i];
      var match = regex.exec(param);
      if (match) {
        params.splice(i--, 1);
        callback(match);
        return true;
      }
    }
    fallback && fallback();
    return false;
  };
  this.last = function(regex, callback, fallback) {
    for (var i = params.length - 1; i >= 0; i--) {
      var param = params[i];
      var match = regex.exec(param);
      if (match) {
        params.splice(i, 1);
        callback(match);
        return true;
      }
    }
    fallback && fallback();
    return false;
  };
}

function strnum(n) {
  return (n * 100 | 0) / 100;
}
