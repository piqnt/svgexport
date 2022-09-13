#!/usr/bin/env node
require('../')
 .cli(process.argv.slice(2))
 .then(
  function() {},
  function(e) {
    console.error(e);
    process.exit(1);
  }
 );
