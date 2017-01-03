import { transform } from './extract.explainshell';

describe('explainshell transform', () => {
  it('parses simple boolean option', () => {
    expect(transform({
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
    })).to.eql({ dir: { alias: 'd',
     type: 'string',
     desc: '<b>-d=DIR</b>, <b>--dir=DIR</b>\n       Install the script into directory DIR, rather than searching for a suitable directory in $PATH.'} });
  });

  it('takes options expecting argument as booleans', () => {
    expect(transform({
      expectsarg: false,
      long: [ '--option' ]
    })).to.eql({
      option: {
        type: 'boolean'
      }
    })
  });

  it('takes options not expecting argument as strings', () => {
    expect(transform({
      expectsarg: true,
      long: [ '--option' ]
    })).to.eql({
      option: {
        type: 'string'
      }
    })
  });

  it('considers short option as alias', () => {
    expect(transform({
      short: [ '-o' ],
      long: [ '--option' ]
    })).to.eql({
      option: {
        alias: 'o',
        type: 'boolean'
      }
    })
  });

  it('considers short option as name when long option not present', () => {
    expect(transform({
      short: [ '-o' ]
    })).to.eql({
      o: {
        type: 'boolean'
      }
    })
  });

});
