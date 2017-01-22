import path from 'path';
import _ from 'lodash';
import sqlite from 'sqlite';
import { nestItems, truncate } from './util';

const dbFile = path.join(__dirname, '../tmp/commands.db');
const dbPromise = sqlite.open(dbFile);

const promisify = func => (...args) => new Promise((resolve, reject) =>
  func(...args, (err, result) => err ? reject(err) : resolve(result)));

const root = {
  name: 'All commands',
  extended: true,
};

export async function getRootNode() {
  if (!root.children) {
    root.children = await loadChildrenRoot();
  }

  return root;
}

export async function getQueryNode(query) {
  return {
    name: query,
    cmd: query,
    extended: true,
    children: await loadChildrenQuery(query)
  };
}

const PAD_SIZE = 25;

function mapChildren(children) {
  return _(children)
    .map((child) => {
      const name = child.name_orig || child.name;
      const ret = {
        ...child,
        name: name, //child.id ? `${name} - ${child.id}` : name,
        extended: false,
      };
      if (child.children) {
        ret.children = mapChildren(child.children);
        ret.name = _.padEnd(truncate(ret.name, PAD_SIZE), PAD_SIZE) + ` (${ret.children.length})`;
      }
      if (child.summary) {
        ret.name = _.padEnd(truncate(ret.name, PAD_SIZE), PAD_SIZE) + ' ' + ret.summary;
      }
      return ret;
    })
    // .keyBy((c) => c.id || c.name)
    .value();
}

async function loadChildrenRoot() {
  const db = await dbPromise;

  const args = {
    $len: 0
  };
  const children = await db.all(`
    select
      substr(name_clean, 0, case when instr(substr(name_clean, $len + 1), ' ') then instr(substr(name_clean, $len + 1), ' ') + $len else length(name_clean)+1 end) as basename,
      count(*) as cnt
    from commands
    group by basename
    order by cnt desc
    limit 1000
  `, args);

  return _(children)
    .map((child) => {
      const hasChildren = child.cnt && child.cnt > 1;
      return {
        ...child,
        name: hasChildren ? `${_.padEnd(truncate(child.basename, PAD_SIZE), PAD_SIZE)} (${child.cnt})` : child.basename,
        cmd: child.basename,
        extended: false,
        children: hasChildren ? { __placeholder__: { name: 'Loading...' } } : null,
      };
    })
    // .keyBy((c) => c.id || c.name)
    .value();
}

export async function loadChildrenExpand(query) {
  const db = await dbPromise;
  const args = {
    $cmd: query,
    $cmdPrefix: query + ' %',
  };

  let children = await db.all(`
    select
      id,
      name as name_orig,
      name_clean as name,
      summary
    from commands
    where name_clean = $cmd or name_clean like $cmdPrefix
    order by name asc
  `, args);

  children = nestItems(children);
  children = mapChildren(children);

  return children;
}

export async function loadChildrenQuery(query) {
  const db = await dbPromise;
  const args = {
    $cmd: query,
    $cmdPrefix: query + '%', // todo fulltext
  };

  let children = await db.all(`
    select
      id,
      name as name_orig,
      name_clean as name,
      summary
    from commands
    where name_clean = $cmd or name_clean like $cmdPrefix or name = $cmd or name like $cmdPrefix
    order by name asc
  `, args);

  children = nestItems(children);
  children = mapChildren(children);

  return children;
}

export async function getCommandDetail(id) {
  const db = await dbPromise;
  return await db.get('select * from commands where id = ?', id);
}
