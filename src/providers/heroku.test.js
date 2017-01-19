import { parseParam } from './heroku';

describe('heroku', () => {

  describe('parseParam', () => {
    it('parses simple boolean option', () => {
      expect(parseParam({ name: '--all', summary: 'view all notifications (not just the ones for the current app)' })).to.eql({
        name: 'all',
        alias: '',
        description: '',
        schema: {
          type: 'boolean',
        },
        summary: 'view all notifications (not just the ones for the current app)',
      });
    });

    it('parses boolean option with short alias', () => {
      expect(parseParam({name: '-A, --all', summary: 'show add-ons and attachments for all accessible apps'})).to.eql({
        name: 'all',
        alias: 'A',
        description: '',
        schema: {
          type: 'boolean',
        },
        summary: 'show add-ons and attachments for all accessible apps',
      });
    });

    it('parses string options', () => {
      expect(parseParam({ name: '-r, --remote REMOTE', summary: 'git remote of app to run command against' })).to.eql({
        name: 'remote',
        alias: 'r',
        description: '',
        schema: {
          type: 'string',
        },
        paramName: 'REMOTE',
        summary: 'git remote of app to run command against',
      });
    });

    it('parses string option without alias', () => {
      expect(parseParam({ name: '--confirm CONFIRM', summary: 'overwrite existing add-on attachment with same name' })).to.eql({
        name: 'confirm',
        alias: '',
        description: '',
        schema: {
          type: 'string',
        },
        paramName: 'CONFIRM',
        summary: 'overwrite existing add-on attachment with same name',
      });
    });
  });

});
