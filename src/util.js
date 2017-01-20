import _ from 'lodash';

export function nestItems(items, depth = 0, prefix='') {
  let result = items;
  if (_.some(items, ({ name }) => name.split(' ').length - 1 > depth)) {
    result = _(items)
    .groupBy(({ name }) => name.split(' ')[depth])
    .map((v, k) => {
      if (v.length === 1) {
        // leaf node, return as is
        return v[0];
      }
      const ret = { name: prefix + k };
      if (v.length > 1) {
        ret.children = nestItems(v, depth + 1, prefix + k + ' ');
      }
      return ret;
    })
    .value();
  }
  return _.orderBy(result, 'name');
}
