import fs from 'mz/fs';
import path from 'path';
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
      let ret = { name: prefix + k };
      if (v.length > 1) {
        const children = nestItems(v, depth + 1, prefix + k + ' ');
        if (children.length === 1) {
          ret = children[0];
        } else {
          ret.children = children;
        }
      }
      return ret;
    })
    .value();
  }
  // if there is a single item make it a root
  if (depth === 0 && result.length === 1 && result[0].children) {
    result = result[0].children;
  }
  return _.orderBy(result, 'name');
}

const omission = '…';
export function truncate(str, len) {
  str = str || '';
  if (str.length <= len) {
    return str;
  }
  len -= omission.length;
  const startCount = Math.ceil(len/2);
  const endCount = len - startCount;
  return str.slice(0, startCount) + omission + str.slice(str.length - endCount);
}

export function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => {
      chunks.push(chunk.toString());
    });
    stream.on('end', () => resolve(chunks.join('')));
    stream.on('error', e => reject(e));
  })
}

export function generateHierarchyFilenames(dir: string, filenames: array<string>) {
  const parts = path.resolve(dir).split(path.sep);

  return _(_.rangeRight(2, parts.length + 1).map((i) => {
    const p =  parts.slice(0, i).join(path.sep);
    return filenames.map(f => path.join(p, f));
  }))
    .flatten()
    .filter()
    .value();
}
