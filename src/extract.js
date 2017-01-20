import path from 'path';
import fs from 'fs';
import sqlite from 'sqlite';
import JSONStream from 'JSONStream';

import { extract as extractHeroku } from './providers/heroku';
import { extract as extractDocker } from './providers/docker';
import { extract as extractExplainshell } from './providers/explainshell';

async function waitForStream(stream) {
  return await new Promise((resolve, reject) => {
    stream.on('end', () => resolve());
    stream.on('error', e => reject(e));
  });
}

async function saveStreamToDb(stream, db) {
  // Optimizations - db can be corrupted if the system or app crashes
  await db.run('PRAGMA synchronous = OFF'); // do not wait for OS to confirm data is synced to disk
  await db.run('PRAGMA journal_mode = MEMORY'); // keep journal in memory instead of disk

  const stmt = await db.prepare("INSERT INTO commands (name, summary, description, schema, examples) VALUES (?, ?, ?, ?, ?)");

  await db.run('BEGIN TRANSACTION');

  stream.on('data', c => {
    stmt.run(c.name, c.summary, c.description, JSON.stringify(c.schema), JSON.stringify(c.examples));
  });

  await waitForStream(stream);
  await stmt.finalize();

  await db.run('END TRANSACTION');
}

async function saveItemsToDb(items, db) {
  const stmt = await db.prepare("INSERT INTO commands (name, summary, description, schema, examples) VALUES (?, ?, ?, ?, ?)");

  await Promise.all(items.map(c => stmt.run(c.name, c.summary, c.description, JSON.stringify(c.schema), JSON.stringify(c.examples))));

  await stmt.finalize();
}

async function saveStreamToFile(stream, filename) {
  stream
    .pipe(JSONStream.stringify())
    .pipe(fs.createWriteStream(filename, {encoding: 'utf-8'}));

  await waitForStream(stream);
}

const dbFile = path.join(__dirname, '../tmp/commands.db');
const dbSchema = `
CREATE TABLE commands (
  id INTEGER PRIMARY KEY,
  name TEXT,
  summary TEXT,
  description TEXT,
  schema TEXT,
  examples TEXT
);`;

async function main() {
  try {
    await fs.unlink(dbFile);
  } catch (ignore) {}
  const db = await sqlite.open(dbFile);
  await db.run(dbSchema);

  await saveItemsToDb(extractHeroku(), db);
  await saveItemsToDb(extractDocker(), db);
  await saveStreamToDb(await extractExplainshell(), db);

  const { dbCount } = await db.get('SELECT count(*) as dbCount FROM commands;');
  console.log(`Entries in db: ${dbCount}`);

  // console.log(await db.all('SELECT id, name FROM commands LIMIT 10;'));

  await db.close();
  return 'done';
}

main().then(x => console.log(x)).catch(x => console.error(x));
