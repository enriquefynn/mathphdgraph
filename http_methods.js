'use strict';

var querystring = require('querystring');
var https = require('https');
var request = require('request');
var promise = require('bluebird');
var cheerio = require('cheerio');
var cheerioTableparser = require('cheerio-tableparser');
var Entities = require('html-entities').XmlEntities;

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
module.exports.getSearchPage = function (name) {
  var pro = promise.defer();
  var post_data = querystring.stringify({
    'searchTerms': name,
    'submit': 'Submit+Query'
  });

  request(
    {
      jar: true,
      url: 'https://www.genealogy.math.ndsu.nodak.edu/quickSearch.php',
      followAllRedirects: true,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': post_data.length
      },
      body: post_data
    }, function (err, res, body) {
      if (err) {
        promise.reject(err);
        return;
      }
      pro.resolve(parse_by_id_or_table(body));
    }
  );
  return pro.promise;
}

function parse_by_id_or_table(body) {
  var pro = promise.defer();
  var entities = new Entities();
  let $ = cheerio.load(body);
  cheerioTableparser($);
  try {
    var faculty_year = $('#paddingWrapper span').html();
    //Maybe Not Id
    if (faculty_year === null) {
      //Does it have a table?
      var data = $('table').parsetable();
      if (data === null) { return promise.reject('table not found') } //Nothing that I know of
      var name_id_json = [];
      var re = /id=(\d+)\"\>(.+)\</;
      for (var i = 0; i < data[0].length; ++i) {
        var id_name = data[0][i].match(re);
        name_id_json.push(
          {
            id: entities.decode(id_name[1]),
            name: entities.decode(id_name[2]),
            faculty: entities.decode(data[1][i]),
            year: data[2][i]
          });
      }
      pro.resolve(name_id_json);
      return pro.promise;
    }
    var name = $('h2').text().replace(/(\n)/gm, '').replace(/\s+/g, ' ').trim();
    var id = null;

    var name_id_advisor_json = [];
    var re_f_y = /.*?>(.*)<\/span> (\d+)/;
    var faculty_year_match = faculty_year.match(re_f_y);
    var faculty, year;

    if (faculty_year_match != null) {
      faculty = entities.decode(faculty_year_match[1]);
      year = faculty_year_match[2]
    }

    var p = $('p');
    var re = /[Advisor|Mentor].*?id=(\d*)\">(.*?)<\/a>/g;;
    var re_id = /.*MGP ID of (\d+).*/;
    var re_for_find_p = /Advisor/;
    while (p !== null && p.html().match(re_for_find_p) == null)
      p = p.next();

    if (p === null) { pro.reject('<p> not found'); return; }

    var m;
    do {
      m = re.exec(p);
      if (m)
        name_id_advisor_json.push(
          {
            id: m[1],
            name: entities.decode(m[2]),
          });
    } while (m);

    while (p !== null) {
      id = p.html().match(re_id)
      p = p.next();
      if (id !== null)
        break;
    }

    pro.resolve({
      name: name, id: id[1],
      faculty: faculty, year: year,
      advisors: name_id_advisor_json
    });
  }
  catch (err) {
    pro.reject(err);
  }

  return pro.promise;
};

module.exports.getInfo = function (id) {
  var pro = promise.defer();
  try {
    request(
      {
        url: 'https://www.genealogy.math.ndsu.nodak.edu/id.php?id=' + id,
        method: 'GET',
      }, function (err, res, body) {
        var entities = new Entities();
        if (err) {
          console.error("ERROR", err);
          pro.reject(err);
        }
        else {
          pro.resolve(parse_by_id_or_table(body));
        }
      }
    );
  }
  catch (err) {
    pro.reject(err);
  }
  return pro.promise;
}
