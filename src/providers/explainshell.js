// @flow
import { spawn } from 'child_process';
import { MongoClient } from 'mongodb';
import mapStream from 'map-stream';

var url = 'mongodb://localhost:27017/explainshell';

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => {
      chunks.push(chunk.toString());
    });
    stream.on('end', () => resolve(chunks.join('')));
    stream.on('error', e => reject(e));
  })
}

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
    ret.alias = obj.short[0].replace(/^--?/, '');
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
  const db = await MongoClient.connect(url);
  const collection = db.collection('manpage');
  const cursor = collection
    .find({})
    // .limit(100)

  return cursor
    .stream()
    .pipe(mapStream(async (data, cb) => {
      console.log(`Extracting ${data.name} ...`);
      const c = await transformCommand(data);
      cb(null, c);
    }))
    .on('end', () => {
      db.close();
    });
}
