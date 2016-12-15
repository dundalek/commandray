import _ from 'lodash';
import yargs from 'yargs/yargs';
import { parseParam, transformUsage, parse, unparse } from '../src/parser';

const commands = require('../commands.json');


// const params = _(commands)
//   .map(c => c.params)
//   .flatten()
//   .uniqBy(a => a.name)
//   .sortBy(a => a.name)
//   .value();
//
// console.log(params);
// console.log(params.map(parseParam));



// const params = _(commands)
//   .map(c => ({
//     usage: c.usage,
//     parsed: transformUsage(c.usage),
//   }))
//   .filter(c => c.usage !== c.parsed)
//   .value();
//
// console.log(JSON.stringify(params, null, 2));



// let count = 0;
// const examples = _(commands)
//   .filter(c => c.examples.length > 0)
//   .map(cmd => {
//     console.log(`-- ${cmd.name} (${cmd.examples.length})`);
//     let commandCount = 0;
//
//     cmd.examples.forEach(e => {
//       const parsed = parse(cmd, e);
//       const unparsed = unparse(cmd, parsed);
//       if (e !== unparsed) {
//         console.log(e);
//         console.log(unparsed);
//         // console.log(parsed);
//       } else {
//         commandCount += 1;
//       }
//     });
//
//     count += commandCount;
//   })
//   .value();
//
// console.log(count);


// const cmd = commands['spaces:vpn:destroy'];
// const parsed = parse(cmd, 'heroku spaces:vpn:destroy --confirm --space my-space')
// const unparsed = unparse(cmd, parsed);
// console.log(parsed);
// console.log(unparsed);



// Arrays
// 'config:set KEY1=VALUE1 [KEY2=VALUE2 ...]',
// 'config:unset KEY1 [KEY2 ...]',

// 'drains:remove [URL|TOKEN]',
