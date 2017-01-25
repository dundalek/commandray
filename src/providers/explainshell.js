// @flow
import { spawn } from 'child_process';
import { MongoClient } from 'mongodb';
import mapStream from 'map-stream';
import { streamToString } from '../util';

var url = 'mongodb://localhost:27017/explainshell';

export function transformParam(obj: Object): Param {
  const name = ((obj.long && obj.long[0]) || (obj.short && obj.short[0])).replace(/^--?/, '');
  const type = obj.expectsarg ? 'string' : 'boolean';
  const ret = {
    name,
    summary: '',
    alias: [],
    schema: {
      type,
    },
    description: '',
  };

  if (obj.text) {
    ret.summary = obj.text;
  }

  if (obj.long && obj.long[0] && obj.short && obj.short[0]) {
    ret.alias = [obj.short[0].replace(/^--?/, '')];
  }

  return ret;
}

export async function transformCommand(data: Object): Promise<Command> {
  const c = {
    name: data.name,
    summary: data.synopsis,
    description: '',
    schema: {
      params: data.paragraphs.filter(p => p.is_option && (p.long || p.short)).map(transformParam),
      usage: '',
    },
    examples: [],
  };
  const filename = '../explainshell/manpages/' + data.source;
  try {
    c.description = await streamToString(spawn('man', ['-l', filename]).stdout);
  } catch (e) {
    console.log(`Missing manpage for ${data.source}`, filename, e);
  }
  return c;
}

export async function extract() {
  try {
    const db = await MongoClient.connect(url);
  } catch (e) {
    console.error('Cannot connect to MongoDB, explainshell commands wil not be available.');
    return null;
  }
  const collection = db.collection('manpage');
  const cursor = collection
    .find({})
    // .limit(100)

  return cursor
    .stream()
    .pipe(mapStream(async (data, cb) => {
      console.log(`Extracting ${data.name} ...`);
      if (data.name.match(/^docker/)) {
        // drop docker commands from explainshell since we have more accurate source
        cb();
      } else {
        const c = await transformCommand(data);
        cb(null, c);
      }
    }))
    .on('end', () => {
      db.close();
    });
}
