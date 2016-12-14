import { spawnSync } from 'child_process';
import fs from 'fs';
import _ from 'lodash';

/* extracts commands/params from heroku help page */
function match(stdout) {
  const commands = []
  const r = /^\s+([a-z-][^#\n]*)#\s+(.+)$/mg;
  let match;

  while (match = r.exec(stdout)) {
    commands.push({
      name: match[1].trim(),
      desc: match[2],
    });
  }

  return commands;
}

/* parses and saves all heroku commands */
function main() {
  const commands = {};

  function loadCommand({ name : usage, desc }) {
    const name = usage.split(' ')[0];
    if (name in commands) {
      return;
    }
    const { stdout } = spawnSync('heroku', ['help', name], { encoding: 'utf-8' });
    if (!stdout) {
      return;
    }
    const children = match(stdout);
    const subcommands = children.filter(({ name }) => name[0] !== '-');

    commands[name] = {
      name,
      usage,
      desc,
      docs: stdout,
      params: children.filter(({ name }) => name[0] === '-'),
      subcommands,
    };
    subcommands.forEach(loadCommand);
  }

  // TODO add list from `heroku commands` for completens

  const { stdout } = spawnSync('heroku', ['help'], { encoding: 'utf-8' });
  match(stdout).forEach(loadCommand);

  fs.writeFileSync('commands.json', JSON.stringify(commands, null, 2));
}

// main()
//.then(x => console.log(x), x => console.log('error', x));

// const commands = require('./commands.json');
//
// _(commands).each((cmd, name) => {
//   fs.writeFileSync(`commands/${name}.txt`, cmd.docs);
//   fs.writeFileSync(`commands/${name}.json`, JSON.stringify({ ...cmd, docs: undefined }, null, 2));
// });
