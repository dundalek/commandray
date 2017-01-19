// @flow
import _ from 'lodash';
import { transformUsage, parse, unparse } from './parser';
const commands = _.keyBy(require('../tmp/commands.json'), 'name');

function testCommandUnparsing(name, example) {
  const cmd = commands[name];
  const parsed = parse(cmd, example);
  const unparsed = unparse(cmd, parsed);

  return unparsed;
}

describe('parser', () => {
  describe('transformUsage', () => {
    it('adds angle brackets to param names', () => {
      expect(transformUsage('addons:attach ADDON_NAME')).to.eql('addons:attach <ADDON_NAME>');
    });
    it('adds angle brackets to compound param names', () => {
      expect(transformUsage('addons:create SERVICE:PLAN')).to.eql('addons:create <SERVICE>:<PLAN>');
    });

    it('normalizes optional parameters', () => {
      expect(transformUsage('config:unset KEY1 [KEY2 ...]')).to.eql('config:unset <KEY1> [KEY2..]');
    });

    it('handles multiple parameters', () => {
      expect(transformUsage('certs:key <CRT> <KEY> [KEY..]')).to.eql('certs:key <CRT> <KEY> [KEY..]');
    });

    it('keeps underscore in command name untouched', () => {
      expect(transformUsage('repo:purge_cache')).to.eql('repo:purge_cache');
    });

    // needs revisiting
    // it('handles key val params', () => {
    //   expect(transformUsage('config:set KEY1=VALUE1 [KEY2=VALUE2 ...]')).to.eql('config:set <KEY1>=VALUE1 [KEY2=VALUE2..]');
    // });
    // it('handles choice params', () => {
    //   expect(transformUsage('ps:type [TYPE | DYNO=TYPE [DYNO=TYPE ...]]')).to.eql('ps:type [TYPE | DYNO=<TYPE> [DYNO=<TYPE>..]]');
    // });
  });

  describe('unparse', () => {
    it('handles standard command', () => {
      const example = 'heroku addons:create heroku-postgresql --app my-app --name main-db --as PRIMARY_DB';
      expect(testCommandUnparsing('heroku addons:create', example)).to.eql(example);
    });

    // this is not a desired behavior but it works like this for now due to yargs limitations
    it('puts positional params first', () => {
      expect(testCommandUnparsing('heroku apps:open', 'heroku open -a myapp /foo')).to.eql('heroku open /foo -a myapp');
    });

    it('handles command without positional args', () => {
      const example = 'heroku spaces:create --space my-space --org my-org --region oregon';
      expect(testCommandUnparsing('heroku spaces:create', example)).to.eql(example);
    });

    it('handles short options', () => {
      const example = 'heroku pipelines:update -s staging -a example-admin';
      expect(testCommandUnparsing('heroku pipelines:update', example)).to.eql(example);
    });

    it('handles boolean options', () => {
      const example = 'heroku apps:info --shell';
      expect(testCommandUnparsing('heroku apps:info', example)).to.eql(example);
    });

    // gets messed up now due to yargs limitation
    // it('handles parsing stop', () => {
    //   const example = 'heroku run -s hobby -- myscript.sh -a arg1 -s arg2';
    //   expect(testCommandUnparsing('run', example)).to.eql(example);
    // });

  })
});
