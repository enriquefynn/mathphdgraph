'use strict';
const http_methods = require('./http_methods');
const promise = require('bluebird');

var max = 255426;
var idx = 1;

function getAll() {
  try {
    return http_methods.getInfo(idx).then(data => {
      let advisors = data.advisors.map(el => el.id).toString()

      let d = `${data.id}, ${data.name}, ${data.faculty}, ${data.year}, ${advisors}`
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

if (process.argv.length > 1) {
  idx = parseInt(process.argv[1])
  max = parseInt(process.argv[2])
}

getAll();

/*

db.each("SELECT * FROM USER", function(err, row) {
    console.log(row);
    });*/
