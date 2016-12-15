import { spawnSync } from 'child_process';
import fs from 'fs';
import _ from 'lodash';

/* extracts commands/params from heroku help page */
function extractPageCommands(stdout) {
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

/* Extracts examples from help page  */
function extractPageExamples(str) {
  const examples = []
  const r = /^\s*\$([^\n]+)$/mg;
  let match;

  while (match = r.exec(str)) {
    examples.push(match[1].trim());
  }

  return _.uniq(examples);
}

/* parses and saves all heroku commands */
function getHerokuCommands() {
  const commands = {};

  function loadCommand({ name : usage, desc }) {
    const name = usage.split(' ')[0];
    if (name in commands) {
      return;
    }
    console.log(`Extracting ${name} ...`);
    const { stdout } = spawnSync('heroku', ['help', name], { encoding: 'utf-8' });
    if (!stdout) {
      return;
    }
    const children = extractPageCommands(stdout);
    const subcommands = children.filter(({ name }) => name[0] !== '-');

    const firstLine = stdout.split(/\n\s*\n/)[0];
    if (firstLine && firstLine.startsWith('Usage:')) {
      usage = firstLine.replace(/^Usage:/, '').trim();
    }

    commands[name] = {
      name,
      usage,
      desc,
      docs: stdout,
      params: children.filter(({ name }) => name[0] === '-'),
      subcommands,
      examples: extractPageExamples(stdout),
    };
    subcommands.forEach(loadCommand);
  }

  // TODO add list from `heroku commands` for completeness

  const { stdout } = spawnSync('heroku', ['help'], { encoding: 'utf-8' });
  extractPageCommands(stdout).forEach(loadCommand);

  return commands;
}

const commands = getHerokuCommands();
fs.writeFileSync('./commands.json', JSON.stringify(commands, null, 2));
// const commands = require('../commands.json');

// write out copy as separate files for easier exploration
_(commands).each((cmd, name) => {
  fs.writeFileSync(`./tmp/commands/${name}.txt`, cmd.docs);
  fs.writeFileSync(`./tmp/commands/${name}.json`, JSON.stringify({ ...cmd, docs: undefined }, null, 2));
});
