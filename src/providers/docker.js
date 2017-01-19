// @flow
import { spawnSync } from 'child_process';
import fs from 'fs';
import _ from 'lodash';

/* extracts commands/params from heroku help page */
function extractPageCommands(stdout) {
  stdout = stdout.split('Commands:')[1];
  const commands = []
  const r = /^\s+([a-z-]+)\s+(.+)$/mg;
  let match;

  while (match = r.exec(stdout)) {
    commands.push({
      name: match[1].trim(),
      summary: match[2],
    });
  }

  return commands;
}

function parseSections(stdout) {
  const lines = stdout.split('\n');
  let section = '';
  let out = [];
  const result = {};
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.match(/^[a-z]+:/i)) {
      if (section) {
        result[section] = out.join('\n').trim();
      }
      section = (line.split(':')[0]).toLowerCase();
      out = [ line.split(':').slice(1).join(';') ];
    } else {
      out.push(line)
    }
  }

  result[section] = out.join('\n').trim();

  return result;
}

function parseParam(x: string): Param {
  const parts = x.trim().split(/   \s*/);
  return {
    name: parts[0],
    summary: parts[1],
    description: '',
    schema: {
      type: 'string',
    }
  };
}

function loadCommand({ name, summary }) {
  console.log(`Extracting docker ${name} ...`);
  const args = name.split(' ').concat(['--help'])
  const stdout = spawnSync('docker', args).stdout.toString('utf-8');
  if (!stdout) {
    return;
  }

  const sections = parseSections(stdout);
  let usage = sections.usage.split('\n');
  let options = sections.options && sections.options.split('\n');
  if (!options) {
    options = usage.filter(l => l.match(/^\s*-/));
    usage = usage.filter(l => !l.match(/^\s*-/))
  }
  let subcommands = sections.commands && sections.commands.split('\n');
  if (!subcommands) {
    subcommands = usage.filter(l => l.match(/^\s+/));
    usage = usage.filter(l => !l.match(/^\s+/))
  }
  subcommands = subcommands.filter(x => x.match(/\s\s\s/)).map(x => {
    const parts = x.split(/\s\s\s+/);
    return {
      name: name + ' ' + parts[0].trim(),
      summary: parts[1].trim(),
    };
  });

  const c : Command = {
    name: 'docker ' + name,
    summary,
    // descX: usage.filter(x => x)[0],
    description: stdout,
    schema: {
      usage: usage[0],
      params: options.map(parseParam),
    },
    examples: [],
  }

  return [c].concat(subcommands.map(loadCommand));
}

export function extract() {
  const stdout = spawnSync('docker', ['help']).stdout.toString('utf-8');
  const commands = _.flattenDeep(extractPageCommands(stdout).map(loadCommand));
  return commands;
}
