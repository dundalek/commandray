import { parseParam } from './parser';

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
});
