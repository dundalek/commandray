// @flow
import { spawnSync } from 'child_process';
import fs from 'fs';
import _ from 'lodash';

/* extracts commands/params from heroku help page */
function extractPageCommands(stdout: string) {
  const commands = []
  const r = /^\s+([a-z-][^#\n]*)#\s+(.+)$/mg;
  let match;

  while (match = r.exec(stdout)) {
    commands.push({
      name: match[1].trim(),
      summary: match[2],
    });
  }

  return commands;
}

/* Extracts examples from help page  */
function extractPageExamples(str: string) {
  const examples = []
  const r = /^\s*\$([^\n]+)$/mg;
  let match;

  while (match = r.exec(str)) {
    examples.push(match[1].trim());
  }

  return _.uniq(examples);
}

/* parses and saves all heroku commands */
export function extract() {
  const commands : { [key: string]: Command }  = {};

  function loadCommand({ name, summary }) {
    let usage = 'heroku ' + name;
    name = name.split(' ')[0];
    if (name in commands) {
      return;
    }
    console.log(`Extracting ${name} ...`);
    const stdout = spawnSync('heroku', ['help', name]).stdout.toString('utf-8');
    if (!stdout) {
      return;
    }
    const children = extractPageCommands(stdout);
    const subcommands = children.filter(({ name }) => name[0] !== '-');

    const firstLine = stdout.split(/\n\s*\n/)[0];
    if (firstLine && firstLine.startsWith('Usage:')) {
      const currentUsage = firstLine.replace(/^Usage:/, '').trim();
      if (currentUsage.length > usage.length) {
        usage = currentUsage;
      }
    }
    usage = usage
      .replace('[--all|--app APP]', '')
      .replace('--app APP', '')
      .replace(/\[?--org ORG\]?/, '')
      .replace(/\[?--role ROLE\]?/, '')
      .trim();

    commands[name] = {
      name: 'heroku ' + name,
      summary,
      description: stdout,
      schema: {
        usage,
        params: children.filter(({ name }) => name[0] === '-'),
      },
      // subcommands,
      examples: extractPageExamples(stdout),
    };
    subcommands.forEach(loadCommand);
  }

  // TODO add list from `heroku commands` for completeness

  const stdout = spawnSync('heroku', ['help']).stdout.toString('utf-8');
  extractPageCommands(stdout).forEach(loadCommand);

  return Object.values(commands);
}
