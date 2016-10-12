'use strict';
const http_methods = require('./http_methods');
const promise = require('bluebird');
const redis = require('redis');
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./names.sql');

var cache = redis.createClient();
promise.promisifyAll(redis.RedisClient.prototype);
cache.on('error', console.error);

var searchById = (id) => {
    var p = promise.defer();
    cache.getAsync(id).then(data => {
        if (data == null)
            p.resolve([]);
        else
            p.resolve(JSON.parse(data));
    }).catch(err => {p.reject(err);});
    return p.promise;
};

var constructTree = (id) => {
    
    var tree_p = promise.defer();

    var tree = {vtx: [], edg: []};
    var all_ids = new Set();
    var nodesToVisit = [searchById(id)];

    var visitNext = (promise_list, ids) => {
        if (promise_list.length == 0)
        {
            tree_p.resolve(tree);
            console.log(tree);
            return;
        }
        var next_p = {promises: [], ids: []};
        var idx = 0;
        return promise.each(promise_list, data => {
            console.log(data);
            tree.vtx.push({id: ids[idx], name: data.name, faculty: data.faculty, year: data.year});
            for (var i in data.advisors)
            {
                if (all_ids.has(data.advisors[i]))
                    continue;

                next_p.promises.push(searchById(data.advisors[i]));
                next_p.ids.push(data.advisors[i]);
                all_ids.add(data.advisors[i]);
                tree.edg.push({to: ids[idx], from: data.advisors[i]});
            }
            idx+=1;
        })
        .then(() => {
            visitNext(next_p.promises, next_p.ids); 
        })
        .catch(err => {tree_p.reject(err);});
    };

    visitNext(nodesToVisit, [id]);
    return tree_p.promise;
};

app.get('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');
    if (req.query.id == undefined)
    {
        res.status(400).send('No id specified');
        return;
    }
    if (/^\D+$/.test(req.query.id))
    {
        res.status(400).send('Not a valid id');
        return;
    }

    constructTree(req.query.id).then(data => {
        res.send(data);
    })
    .catch(err => {
        console.error(err);
        res.status(400).send('Error happened');
    });
});

app.get('/search', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');
    if (req.query.name == undefined)
    {
        res.status(400).send('No name specified');
        return;
    }

    console.log('Search:', req.query.name);
    var p = promise.defer();
    /*db.exec('SELECT * FROM USER WHERE Name LIKE \"%' + req.query.name + '%\"', function(err, row) {
        if (err)
            console.error(err);
        else
            console.log('row:', row);
    });*/

    http_methods.getSearchPage(req.query.name).then(data => {
        res.send(data);
    }).catch(err => {
        console.error(err);
        res.status(400).send('Error happened');
    });
});

app.listen(8080, () => {console.log('listening...');});


/*var p = http_methods.getSearchPage('fernando', 'pedone');
p.then(data => {
    console.log(data);
});*/



/*var p = http_methods.getInfo(7404);
p.then(d => {
    console.log(d);
});*/
