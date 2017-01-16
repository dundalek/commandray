// @flow

import _ from 'lodash';
import yargs from 'yargs/yargs';

/* Returns option in yargs object format from geroku line example */
export function parseParam(cmd: Object): Param {
  const parts = cmd.name.split(',').map(x => x.trim());
  const short = (parts.filter(x => x.match(/^-[^-]/))[0] || '').replace(/^-+/, '');
  const longParts = parts.filter(x => x.match(/^--/))[0].replace(/^-+/, '').split(' ');
  const long = longParts[0];

  const paramName = longParts[1] || undefined;
  const type = (!!short && !long) || (long && !paramName) ? 'boolean' : 'string';

  const obj = {
    name: long || short,
    alias: long ? short : undefined,
    summary: cmd.desc,
    description: '',
    schema: {
      type,
    },
  };

  if (paramName) {
    (obj: Object).paramName = paramName;
  }

  return obj;
}

/* Transforms command's usage line to a yargs format */
export function transformUsage(usage: string): string {
  return usage
    .replace(/[<\[=]?([A-Z][A-Z_0-9]*)[>\]=]?/g, (a, b) => a === b ? `<${b}>` : a)
    .replace(/\s*\.\.\.\]/g, '..]');
}

function formatOption(key) {
  return (key.length === 1 ? '-' : '--') + key;
}

export function parse(cmd: Command, example: string) {
  // const usage = transformUsage(cmd.usage);
  const options = cmd.params.map(parseParam).reduce(_.assign, {});
  const parsed = yargs().options(options).parse(example);
  return parsed;
}

/* Serializes parsed command back into string */
export function unparse(cmd: Command, parsed: Object) {
  const options = cmd.params.map(parseParam).reduce(_.assign, {});
  const aliases = _.reduce(options, (result, val, key) => {
    if (val.alias) {
      result[val.alias] = key;
    }
    return result;
  }, {});
  const ignore = {};
  const tokens = [];
  _.each(parsed, (val, key) => {
    if (key === '_' || key === '$0' || val === undefined || val === null || val === false || key in ignore) return;
    if (key in aliases) {
      ignore[aliases[key]] = true;
    }
    if (key in options && options[key].alias) {
      ignore[options[key].alias] = true;
    }
    // if (key === '_' || key === '$0' || key in aliases || val === undefined) return;
    // if (!(key in options) || val === undefined) return;
    if (val === true) {
      tokens.push(formatOption(key));
    } else {
      tokens.push(`${formatOption(key)} ${val}`);
    }

  });
  return (parsed._ || []).concat(tokens).join(' ');
}
