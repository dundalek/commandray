import _ from 'lodash';
const herokuCommands = require('../tmp/commands.json');
const dockerCommands = require('../tmp/commands-docker.json');

// handmade customizations can be here
herokuCommands.run.usage = 'heroku run COMMAND';

const commands = _.map(herokuCommands, x => ({
  ...x,
  name: 'heroku ' + x.name,
})).concat(dockerCommands.map(x => ({
  ...x,
  name: 'docker ' + x.name,
})));


export default _.keyBy(commands, 'name');
