import _ from 'lodash';
import yargs from 'yargs';

const commands = require('../commands.json');

/* returns option in yargs object format from geroku line example */
export function parseParam(cmd) {
  const parts = cmd.name.split(',').map(x => x.trim());
  const short = (parts.filter(x => x.match(/^-[^-]/))[0] || '').replace(/^-+/, '');
  const longParts = parts.filter(x => x.match(/^--/))[0].replace(/^-+/, '').split(' ');
  const long = longParts[0];

  const paramName = longParts[1] || '';

  const type = (!!short && !long) || (long && !paramName) ? 'boolean' : 'string';

  const name = long || short;

  return {
    [name]: {
      // ...cmd,
      alias: long ? short : undefined,
      type,
      desc: cmd.desc,
      default: null,
      // paramName,
      //desc: (longParts ? `${longParts} ` : ' - ') + cmd.desc,
    }
  };
}

// const params = _(commands)
//   .map(c => c.params)
//   .flatten()
//   .uniqBy(a => a.name)
//   // .map(c => c.name.split(' ')[0])
//   // .sort()
//   .value();
// // console.log(params);
//
// console.log(params.map(parseParam));


export function parseUsage(usage) {
  return usage
    .replace(/[<\[=]?([A-Z_]+)[>\]=]?/g, (a, b) => a === b ? `<${b}>` : a)
    .replace(/\s*\.\.\.\]/g, '..]');
}

// const params = _(commands)
//   .map(c => ({
//     usage: parseUsage(c.usage),
//     options: c.params.map(parseParam).reduce(_.assign, {}),
//   }))
//   .sort()
//   .value();
//
// console.log(JSON.stringify(params, null, 2));

function matchExamples(str) {
  const examples = []
  const r = /^\s*\$([^\n]+)$/mg;
  let match;

  while (match = r.exec(str)) {
    examples.push(match[1].trim());
  }

  return examples;
}

function formatOption(key) {
  return (key.length === 1 ? '-' : '--') + key;
}

export function unparse(parsed, options) {
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


// let count = 0;
//
// const examples = _(commands)
//   .map(c => ({
//     ...c,
//     examples: matchExamples(c.docs),
//   }))
//   .filter(c => c.examples.length > 0)
//   .map(cmd => {
//     console.log('-- ' + cmd.name);
//     const usage = parseUsage(cmd.usage);
//     const options = cmd.params.map(parseParam).reduce(_.assign, {});
//     const examples = matchExamples(cmd.docs);
//
//     examples.forEach(e => {
//       const parsed = yargs.usage(usage, options).parse(e);
//       const unparsed = unparse(parsed, options);
//       if (e !== unparsed) {
//         console.log(e);
//         console.log(unparsed);
//         // console.log(parsed);
//       } else {
//         count += 1;
//       }
//     });
//   })
//   .value();
//
// console.log(count);





// maybe just use yargs-parser

// Required positional arguments take the form <foo>, and optional arguments take the form [bar].
//
// completions
//
// .options()

// yargs.usage('Usage: $0 -w [num] -h [num]')
// console.log(yargs.parse([ '-x', '1', '-y', '2' ]));

// yargs.usage(message, [opts])

// Arrays
// 'config:set KEY1=VALUE1 [KEY2=VALUE2 ...]',
// 'config:unset KEY1 [KEY2 ...]',


// 'drains:remove [URL|TOKEN]',


// const cmd = commands['apps:create'];
// const usage = parseUsage(cmd.usage);
// const options = cmd.params.map(parseParam).reduce(_.assign, {});
// const examples = matchExamples(cmd.docs);
//
// // examples.forEach(e => {
// //   const parsed = yargs.usage(usage, options).parse(e);
// //   const unparsed = unparse(parsed, options);
// //   if (e !== unparsed) {
// //     console.log(e);
// //     console.log(unparsed);
// //   }
// // });
//
// // const parsed = yargs.usage(usage, options).parse('heroku apps:create example-staging --ssh-git --remote staging');
//
// const parsed = yargs.options(options).parse('example-staging x --ssh-git --remote staging');
//
// console.log(usage);
// console.log(options);
// console.log(parsed);
// console.log(unparse(parsed, options));
