## svgexport

svgexport is a command-line utility and Node.js module for exporting SVG files to PNG and JPEG. It uses PhantomJS for rendering SVG files.

#### Command Line

Installation
```
npm install svgexport -g
```

Usage
```usage
svgexport <input file> <output file> <options>
svgexport <datafile>

<options>        [<format>] [<quality>%] <input viewbox> [<output size>]
<format>         png|jpeg|jpg
<quality>        1-100
<input viewbox>  [<left>:<top>:]<width>:<height>
<output size>    <scale>x|<width>w|<height>h|<width>:<height>

<datafile>       A JSON file with following content:
                 [ {
                   "input" : "<input file> <options>",
                   "output": [
                     "<output file> <options>",
                     ...
                   ]
                 }, ...]

If format is not specified, it will be inferred from output file extension or
defaults to "png".

If output size is specified as width:height and its aspect ratio doesn\'t match
input viewbox, viewbox will be centered and cropped.

Instead of JSON file, a Node module which exports same content can be provided
as datafile.

In datafile, options specified after output file are merged with and take 
precedence over options specified after output file.
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
