'use strict';
const http_methods = require('./http_methods');
const promise = require('bluebird');
const redis = require('redis');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('names.sql');
//db.run('DROP TABLE USER');
db.run('CREATE TABLE IF NOT EXISTS USER (Name TEXT, Id INTEGER PRIMARY KEY, Faculty TEXT, Year TEXT)');
db.run('CREATE INDEX IF NOT EXISTS name_idx ON USER(Name)');

var cache = redis.createClient();
promise.promisifyAll(redis.RedisClient.prototype);
cache.on('error', console.error);

var max = 206701;
var idx = 1;
function getAll(){
    try
    {
        return http_methods.getInfo(idx).then(data => {
            console.log(data);
            cache.set(data.id, JSON.stringify({
               name: data.name,
               faculty: data.faculty,
               year: data.year,
               advisors: data.advisors.map(el => el.id)
            }));
        }).then(() => {
            if (idx < max)
            {
                idx = idx+1;
                getAll();
            }
        }).catch((err) => {
            if (err.code !== undefined)
            {
                console.error('Connection error', err);
                getAll();
            }
            else
            {
                console.error('Probably not a valid index', idx, err);
                if (idx < max)
                {
                    idx = idx+1;
                    getAll();
                }
            }
        });
    }
    catch(err)
    {
        console.error('Ops', err);
        getAll();
    }
}
getAll();

/*

db.each("SELECT * FROM USER", function(err, row) {
    console.log(row);
    });*/
