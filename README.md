## svgexport

svgexport is a Node.js module and command-line tool for exporting SVG files to PNG and JPEG, it uses PhantomJS for rendering SVG files.

#### Command Line

Installation
```
npm install svgexport -g
```

Usage
```usage
svgexport <input file> <output file> <options>
svgexport <datafile>

<options>        [<format>] [<quality>] [<input viewbox>] [<output size>]

<format>         png|jpeg|jpg
                 If not specified, it will be inferred from output file extension or defaults to "png".
                 
<quality>        1%-100%

<input viewbox>  <left>:<top>:<width>:<height>|<width>:<height>
                 If input viewbox is not specified it will be inferred from input file.
                 
<output size>    <scale>x|<width>:<height>|<width>:|:<height>
                 If specified as width:height, viewbox will be centered and cropped to match output aspect ratio.

<datafile>       A JSON file with following content:
                 [ {
                   "input" : "<input file> <options>",
                   "output": [ "<output file> <options>", ... ]
                 }, ...]
                 Input file options are merged with and overridden by output file options.
                 Instead of a JSON file, a Node module which exports same content can be provided.
```

Examples
```
svgexport input.svg output.png 1.5x
svgexport input.svg output.png 54:
svgexport input.svg output.png 32:54
svgexport input.svg output.png -1:-1:24:24 1x
svgexport input.svg output.jpg 80% 24:24 48:64
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


*Keywords: svg, export, rasterize, converter, png, jpeg, jpg, cli, command-line, inkscape, illustrator, coreldraw*
