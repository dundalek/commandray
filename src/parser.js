// @flow
import _ from 'lodash';
import yargs from 'yargs/yargs';

/* Transforms command's usage line to a yargs format */
export function transformUsage(usage: string): string {
  return usage
    .replace(/[<\[=]?([A-Z][A-Z_0-9]*)[>\]=]?/g, (a, b) => a === b ? `<${b}>` : a)
    .replace(/\s*\.\.\.\]/g, '..]');
}

function formatOption(key) {
  return (key.length === 1 ? '-' : '--') + key;
}

export function transformParam(param: Param) {
  const obj = {};

  if (param.schema && param.schema.type) {
    obj.type = param.schema.type;
  }

  if (param.alias && param.alias[0]) {
    obj.alias = param.alias[0];
  }

  return {
    [param.name]: obj
  };
}

export function parse(cmd: Command, example: string) {
  // const usage = transformUsage(cmd.usage);
  const options = cmd.schema.params.map(transformParam).reduce(_.assign, {});
  const parsed = yargs().options(options).parse(example);
  return parsed;
}

/* Serializes parsed command back into string */
export function unparse(cmd: Command, parsed: Object) {
  const options = cmd.schema.params.map(transformParam).reduce(_.assign, {});
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
