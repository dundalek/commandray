import { parseParam, transformUsage } from './parser';

describe('parser', () => {
  describe('parseParam', () => {
    it('parses simple boolean option', () => {
      expect(parseParam({ name: '--all',
      desc: 'view all notifications (not just the ones for the current app)' })).toEqual({ all:
     { alias: '',
       type: 'boolean',
       desc: 'view all notifications (not just the ones for the current app)',
       default: null } });
    });

    it('parses boolean option with short alias', () => {
      expect(parseParam({name: '-A, --all', desc: 'show add-ons and attachments for all accessible apps'})).toEqual({
        all: {
          alias: 'A',
          type: 'boolean',
          desc: 'show add-ons and attachments for all accessible apps',
          default: null
        }
      });
    });

    it('parses string options', () => {
      expect(parseParam({ name: '-r, --remote REMOTE',
    desc: 'git remote of app to run command against' })).toEqual({ remote:
     { alias: 'r',
       type: 'string',
       paramName: 'REMOTE',
       desc: 'git remote of app to run command against',
       default: null } });
    });

    it('parses string option without alias', () => {
      expect(parseParam({ name: '--confirm CONFIRM',
    desc: 'overwrite existing add-on attachment with same name' })).toEqual({ confirm:
     { alias: '',
       type: 'string',
       paramName: 'CONFIRM',
       desc: 'overwrite existing add-on attachment with same name',
       default: null } });
    });
  });

  describe('transformUsage', () => {
    it('adds angle brackets to param names', () => {
      expect(transformUsage('addons:attach ADDON_NAME')).toEqual('addons:attach <ADDON_NAME>');
    });
    it('adds angle brackets to compound param names', () => {
      expect(transformUsage('addons:create SERVICE:PLAN')).toEqual('addons:create <SERVICE>:<PLAN>');
    });

    it('normalizes optional parameters', () => {
      expect(transformUsage('config:unset KEY1 [KEY2 ...]')).toEqual('config:unset <KEY1> [KEY2..]');
    });

    it('handles multiple parameters', () => {
      expect(transformUsage('certs:key <CRT> <KEY> [KEY..]')).toEqual('certs:key <CRT> <KEY> [KEY..]');
    });

    it('keeps underscore in command name untouched', () => {
      expect(transformUsage('repo:purge_cache')).toEqual('repo:purge_cache');
    });

    // needs revisiting
    // it('handles key val params', () => {
    //   expect(transformUsage('config:set KEY1=VALUE1 [KEY2=VALUE2 ...]')).toEqual('config:set <KEY1>=VALUE1 [KEY2=VALUE2..]');
    // });
    // it('handles choice params', () => {
    //   expect(transformUsage('ps:type [TYPE | DYNO=TYPE [DYNO=TYPE ...]]')).toEqual('ps:type [TYPE | DYNO=<TYPE> [DYNO=<TYPE>..]]');
    // });
  });
});
