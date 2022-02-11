# svgexport

svgexport is a Node.js module and command-line tool for exporting SVG files to PNG and JPEG, it uses Puppeteer for rendering SVG files.

### Command Line

#### Installation
```
npm install svgexport -g
```

#### Installation Issues
You might encounter an error while installing because of a puppeteer issue documented here
[puppeteer/puppeteer#367](https://github.com/puppeteer/puppeteer/issues/367)

To circumvent this, you will need the following command
```
sudo npm install -g svgexport --unsafe-perm=true
```

#### Usage
```usage
svgexport <input file or data:url> <output file> <options>
svgexport <datafile>

<options>        [<format>] [<quality>] [<input viewbox>] [<output size>] [<resize mode>] [<styles>]

<format>         png|jpeg|jpg
                 If not specified, it will be inferred from output file extension or defaults to "png".

<quality>        1%-100%

<input viewbox>  <left>:<top>:<width>:<height>|<width>:<height>
                 If input viewbox is not specified it will be inferred from input file.

<output size>    <scale>x|<width>:<height>|<width>:|:<height>
                 If output size is specified as width:height, <viewbox mode> is used.

<viewbox mode>   crop|pad
                 Crop (slice) or pad (extend) input to match output aspect ratio, default mode is "crop".

<datafile>       Path of a JSON file with following content:
                 [ {
                   "input" : ["<input file or data:url>", "<option>", "<option>", ...],
                   "output": [ ["<output file>", "<option>", "<option>", ...] ]
                 }, ...]
                 Input file options are merged with and overridden by output file options.
                 Instead of a JSON file, a Node module which exports same content can be provided.
```

#### Examples

Scale 1.5x proportionally:
```
svgexport input.svg output.png 1.5x
```

Scale proportionally to set output width to 32px:
```
svgexport input.svg output.png 32:
```

Scale proportionally and pad output to set output width:height to 32px:54px:
```
svgexport input.svg output.png pad 32:54
```

Export `-1:-1:24:24` (`left:top:width:height`) of input.svg to output.png:
```
svgexport input.svg output.png -1:-1:24:24 1x
```

Set output JPEG quality:
```
svgexport input.svg output.jpg 80%
```

Use a CSS to style input SVG:
```
svgexport input.svg output.jpg "svg{background:silver;}"
```

By default, Puppeteer has a page load timeout of 30 seconds. This might not be
enough for large SVG files. If you want to change the page timeout, set the
`SVGEXPORT_TIMEOUT` environment variable to the desired number of seconds.
```bash
// One minute timeout
SVGEXPORT_TIMEOUT=60 svgexport input.svg output.png
```

### Node.js Module

#### Installation
```
npm install svgexport --save
```

#### Usage

```javascript
var svgexport = require('svgexport');

svgexport.render(datafile, callback);
```
`datafile` can be an object, an array of objects or a JSON file path, see command line usage for its format.

### Contributors

svgexport was migrated from PhantomJS to Puppeteer by [Michael Heerklotz](https://github.com/MichaelHeerklotz).

### License

Copyright (c) 2016 Ali Shakiba
Available under the MIT license

*Keywords: svg, export, rasterize, converter, png, jpeg, jpg, cli, command-line, inkscape, illustrator, coreldraw*
