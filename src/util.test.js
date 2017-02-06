import { nestItems, truncate, generateHierarchyFilenames } from './util';

describe('util', () => {
  describe('nestItems', () => {
    it('simple case', () => {
      expect(nestItems([
        { name: 'c' },
        { name: 'a' },
        { name: 'b' }
      ])).to.eql([
        { name: 'a' },
        { name: 'b' },
        { name: 'c' }
      ]);
    });

    it('another case', () => {
      expect(nestItems([
        { name: 'a' },
        { name: 'b' },
        { name: 'b 1' },
        { name: 'c' }
      ])).to.eql([
        { name: 'a' },
        { name: 'b', children: [
          { name: 'b' },
          { name: 'b 1' },
        ]},
        { name: 'c' }
      ]);
    });

    it('keeps order of simply nested items', () => {
      expect(nestItems([
        { name: 'a' },
        { name: 'a 1 e f' },
      ])).to.eql([
        { name: 'a' },
        { name: 'a 1 e f' },
      ]);
    });

    it('does not nest single item groups', () => {
      expect(nestItems([
        { name: 'a b c 1' },
        { name: 'a b c 2' },
        { name: 'b' }
      ])).to.eql([
        { name: 'a b c', children: [
          { name: 'a b c 1' },
          { name: 'a b c 2' },
        ]},
        { name: 'b' }
      ]);
    });

    it('general case', () => {
      expect(nestItems([
        { name: 'a' },
        { name: 'a 1 e' },
        { name: 'a 1 f' },
        { name: 'a 1 g' },
        { name: 'a 2 i' },
        { name: 'a 2 j' },
        { name: 'a 3 x' },
        { name: 'b 1' },
        { name: 'b 1 l' },
        { name: 'b 2 m' },
        { name: 'b 2 m z' },
        { name: 'b 2' }
      ])).to.eql([
        { name: 'a', children: [
          { name: 'a' },
          { name: 'a 1', children: [
            { name: 'a 1 e' },
            { name: 'a 1 f' },
            { name: 'a 1 g' }
          ]},
          { name: 'a 2', children: [
            { name: 'a 2 i' },
            { name: 'a 2 j' }
          ]},
          { name: 'a 3 x' }
        ]},
        { name: 'b', children: [
          { name: 'b 1', children: [
            { name: 'b 1' },
            { name: 'b 1 l' }
          ]},
          { name: 'b 2', children: [
            { name: 'b 2' },
            { name: 'b 2 m', children: [
              { name: 'b 2 m' },
              { name: 'b 2 m z' }
            ]}
          ]}
        ]}
      ]);
    });

    it('preserves custom attributes for leaf nodes', () => {
      expect(nestItems([
        { name: 'a', customAttr: 1 },
        { name: 'a 1', someVal: 3 },
        { name: 'a 1 e f', test: 'a' },
      ])).to.eql([
        { name: 'a', customAttr: 1 },
        { name: 'a 1', children: [
          { name: 'a 1', someVal: 3 },
          { name: 'a 1 e f', test: 'a' }
        ]}
      ]);
    });
  });

  describe('truncate', () => {
    it('truncates', () => {
      expect(truncate('hello world', 7)).to.eql('hel…rld');
      expect(truncate('abcde', 4)).to.eql('ab…e');
      expect(truncate('abcd', 3)).to.eql('a…d');
      expect(truncate('abcd', 2)).to.eql('a…');
      expect(truncate('abcd', 1)).to.eql('…');
      expect(truncate('abcd', 0)).to.eql('…');
    });

    it('does not touch short strings', () => {
      expect(truncate('abc', 3)).to.eql('abc');
      expect(truncate('abc', 5)).to.eql('abc');
    });
  });

  describe('generateHierarchyFilenames', () => {
    it('generates files', () => {
      expect(generateHierarchyFilenames('/home/me', ['COMMANDS.md', '.COMMANDS.md'])).to.eql([
        '/home/me/COMMANDS.md',
        '/home/me/.COMMANDS.md',
        '/home/COMMANDS.md',
        '/home/.COMMANDS.md',
      ]);
    });
  });
});
