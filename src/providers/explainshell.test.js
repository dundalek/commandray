// @flow
import { transformParam } from './explainshell';

describe('explainshell transformParam', () => {
  it('parses simple boolean option', () => {
    expect(transformParam({
      "expectsarg": true,
      "short": [
        "-d"
      ],
      "nestedcommand": false,
      "idx": 16,
      "text": "<b>-d=DIR</b>, <b>--dir=DIR</b>\n       Install the script into directory DIR, rather than searching for a suitable directory in $PATH.",
      "section": "COMMAND-LINE OPTIONS",
      "argument": null,
      "long": [
        "--dir"
      ],
      "is_option": true,
      "explainshell_command": "0alias"
    })).to.eql({
      alias: ['d'],
      description: '',
      name: 'dir',
      schema: {
        type: 'string',
      },
      summary: '<b>-d=DIR</b>, <b>--dir=DIR</b>\n       Install the script into directory DIR, rather than searching for a suitable directory in $PATH.'
    });
  });

  it('takes options expecting argument as booleans', () => {
    expect(transformParam({
      expectsarg: false,
      long: [ '--option' ]
    })).to.eql({
      name: 'option',
      description: '',
      summary: '',
      alias: [],
      schema: {
        type: 'boolean'
      }
    });
  });

  it('takes options not expecting argument as strings', () => {
    expect(transformParam({
      expectsarg: true,
      long: [ '--option' ]
    })).to.eql({
      name: 'option',
      description: '',
      summary: '',
      alias: [],
      schema: {
        type: 'string'
      }
    })
  });

  it('considers short option as alias', () => {
    expect(transformParam({
      short: [ '-o' ],
      long: [ '--option' ]
    })).to.eql({
      name: 'option',
      alias: ['o'],
      description: '',
      summary: '',
      schema: {
        type: 'boolean'
      }
    })
  });

  it('considers short option as name when long option not present', () => {
    expect(transformParam({
      short: [ '-o' ]
    })).to.eql({
      name: 'o',
      description: '',
      summary: '',
      alias: [],
      schema: {
        type: 'boolean'
      }
    })
  });

});
