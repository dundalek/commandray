export function transform(obj) {
  const name = ((obj.long && obj.long[0]) || (obj.short && obj.short[0])).replace(/^--?/, '');
  const type = obj.expectsarg ? 'string' : 'boolean';
  const ret = {
    type,
  };

  if (obj.text) {
    ret.desc = obj.text;
  }

  if (obj.long && obj.long[0] && obj.short && obj.short[0]) {
    ret.alias = obj.short[0].replace(/^--?/, '');
  }

  return {
    [name]: ret
  };
}
