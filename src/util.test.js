import { nestItems } from './util';

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
});
