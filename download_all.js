#!/usr/bin/env node
'use strict';
const http_methods = require('./http_methods');
const promise = require('bluebird');

function getAll() {
  try {
    return http_methods.getInfo(idx).then(data => {
      let advisors = data.advisors.map(el => el.id).join(', ')

      let d = `${data.id}, ${data.name}, ${data.faculty} - ${data.year}, ${advisors}`
      console.log(d);
    }).then(() => {
      if (idx < max) {
        idx = idx + 1;
        getAll();
      }
    }).catch((err) => {
      if (err.code !== undefined) {
        console.error('Connection error', err);
        getAll();
      }
      else {
        console.error('Probably not a valid index', idx, err);
        if (idx < max) {
          idx = idx + 1;
          getAll();
        }
      }
    });
  }
  catch (err) {
    console.error('Ops', err);
    getAll();
  }
}

var max = 255426;
var idx = 1;
if (process.argv.length > 2) {
  idx = parseInt(process.argv[2])
  max = parseInt(process.argv[3])
}

getAll();

/*

db.each("SELECT * FROM USER", function(err, row) {
    console.log(row);
    });*/
