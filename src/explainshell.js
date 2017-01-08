var MongoClient = require('mongodb').MongoClient;
var mapStream = require('map-stream');
var JSONStream = require('JSONStream');
var fs = require('fs');
import { transform } from './extract.explainshell';

var url = 'mongodb://localhost:27017/explainshell';

var sqlite3 = require('sqlite3').verbose();
var sdb = new sqlite3.Database('tmp/commands.db');

MongoClient.connect(url, function(err, db) {
  var collection = db.collection('manpage');

  var cursor = collection.find({})
    // .limit(10)
    // .pipe(process.stdout)

    var out = fs.createWriteStream('tmp/out.json', 'utf8');
    out.write('[\n');
    var first = true;

    sdb.serialize(function() {
      // sdb.run("CREATE TABLE lorem (id INTEGER PRIMARY KEY, name TEXT, data TEXT, man TEXT)");
      //
      // var stmt = sdb.prepare("INSERT INTO lorem (name, data, man) VALUES (?, '', '')");
      // for (var i = 0; i < 10; i++) {
      //     stmt.run("Ipsum " + i);
      // }
      // stmt.finalize();

      // sdb.each("SELECT rowid AS id, name FROM lorem", function(err, row) {
      //     console.log(row.id + ": " + row.name);
      // });

      cursor
        .stream()
        // .pipe(mapStream((data, cb) => cb(null, {
        //   name: data.name,
        //   paragraphs: data.paragraphs,
        // })))
        // .pipe(mapStream((data, cb) => cb(null, JSON.stringify(data, null, 2))))
        // .pipe(JSONStream.stringify())
        // .pipe(out)
        // .on('data', data => { out.write(data); out.write('\n') })
        .on('data', data => {
          let x = {
            name: data.name,
            desc: data.synopsis,
            params: data.paragraphs.filter(p => p.is_option && (p.long || p.short)).map(transform),
          }
          if (first) {
            first = false;
          } else {
            out.write(',\n');
          }
          out.write(JSON.stringify(x, null, 2));

          // data.paragraphs.filter(p => p.is_option).forEach(p => {
          //   p.explainshell_command = data.name;
          //   if (first) {
          //     first = false;
          //   } else {
          //     out.write(',\n');
          //   }
          //   if (p.short || p.long) {
          //     p = transform(p);
          //     out.write(JSON.stringify(p, null, 2));
          //   }
          // })
        })
        .on('end', () => {
          // console.log('end');
          db.close()
          out.write('\n]')
          out.end()
        })

    // .toArray(function(err, docs) {
    //   console.log(err);
    //   console.log("Found the following records");
    //   console.log(docs)
    //   db.close();
    // });



    });

    sdb.close();


});
