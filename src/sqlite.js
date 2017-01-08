var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

db.serialize(function() {
  db.run("CREATE TABLE lorem (name TEXT, data TEXT, man TEXT)");

  var stmt = db.prepare("INSERT INTO lorem VALUES (?, '', '')");
  for (var i = 0; i < 10; i++) {
      stmt.run("Ipsum " + i);
  }
  stmt.finalize();

  db.each("SELECT rowid AS id, name FROM lorem", function(err, row) {
      console.log(row.id + ": " + row.name);
  });
});

db.close();
