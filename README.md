## svgexport

svgexport is a command-line utility and Node.js module for exporting SVG files to PNG, JPEG and PDF. It uses PhantomJS for rendering SVG files.

#### Command Line

Installation
```
npm install svgexport -g
```

Usage
```usage
svgexport <input file> <output file> <options>
svgexport <datafile>

<options>        [<format>] [<quality>%] [<input viewbox>] [<output size>] [<pdf size>]
<format>         png|jpeg|jpg|pdf
<quality>        1-100
<input viewbox>  [<left>:<top>:]<width>:<height>
<output size>    <scale>x|<width>:<height>|<width>:|:<height>
<pdf size>       <width>(mm|cm|in|px):<height>(mm|cm|in|px)
                 A3|A4|A5|Legal|Letter|Tabloid [portrait|landscape]

<datafile>       A JSON file with following content:
                 [ {
                   "input" : "<input file> <options>",
                   "output": [ "<output file> <options>", ... ]
                 }, ...]

Examples:        svgexport input.svg output.png 24:24 1x
                 svgexport input.svg output.png 54:
                 svgexport input.svg output.jpg 80% 24:24 48:64
                 svgexport input.svg output.pdf 2x A3 landscape

- If input viewbox is not specified it will be inferred from input file.
- If output size is specified as width:height and its aspect ratio doesn't match
input viewbox, viewbox will be centered and cropped.
- If format is not specified, it will be inferred from output file extension or
defaults to "png".
- In datafile, input file options are merged with and overridden by output file
options.
- Instead of JSON file, a Node module which exports same content can be provided
as datafile.
```

#### Node Module

Installation
```
npm install svgexport --save
```

Usage

```javascript
var svgexport = require('svgexport');

svgexport.render(datafile, callback);
```
`datafile` can be an object/array or a JSON file path, see command line usage for its format.


*Keywords: svg, export, rasterize, converter, png, jpeg, jpg, pdf, cli, command-line, inkscape, illustrator, coreldraw*
