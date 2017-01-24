import { spawn } from 'child_process';
import path from 'path';
import fs from 'mz/fs';
import _ from 'lodash';
import sqlite from 'sqlite';
import { nestItems, truncate, streamToString } from './util';

const dbFile = path.join(__dirname, '../tmp/commands.db');
const dbPromise = sqlite.open(dbFile);

const promisify = func => (...args) => new Promise((resolve, reject) =>
  func(...args, (err, result) => err ? reject(err) : resolve(result)));

let root = null;

export async function getRootNode() {
  if (!root) {
    const sources = (await Promise.all([
      loadNpmScripts(),
      loadRakeTasks(),
      loadMakeTargets(),
      getAllCommandsNode(),
    ])).filter(x => x);
    if (sources.length > 1) {
      root = {
        name: '',
        children: sources,
        extended: true,
      }
    } else {
      root = sources[0];
    }
  }

  return root;
}

async function getAllCommandsNode() {
  return {
    name: 'All commands',
    extended: true,
    children: await loadChildrenRoot()
  };
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

export async function loadNpmScripts() {
  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    const children = _.map(pkg.scripts, (val, key) => {
      const cmd = `npm run ${key}`;
      return {
        name: _.padEnd(cmd, 25) + ' ' + val,
        cmd,
        executable: true,
      };
    });

    return {
      name: 'Npm scripts',
      children,
      extended: true,
    }
  } catch (ignore) {}
  return null;
}

export async function loadMakeTargets() {
  try {
    if (await fs.exists('Makefile')) {
      // http://unix.stackexchange.com/a/230050
      let targets = (await streamToString(spawn('bash', ['-c', "make -qp | awk -F':' '/^[a-zA-Z0-9][^$#\/\t=]*:([^=]|$)/ {split($1,A,/ /);for(i in A)print A[i]}'"]).stdout)).trim();
      if (targets) {
        const children = _(targets.trim().split('\n'))
          .uniq()
          .sortBy()
          .map(c => {
            const cmd = `make ${c}`;
            return {
              name: cmd,
              cmd,
              executable: true,
            };
          })
          .value();

        return {
          name: 'Make targets',
          extended: true,
          children,
        };
      }
    }
  } catch (ignore) {}
  return null;
}

export async function loadRakeTasks() {
  try {
    const stdout = (await streamToString(spawn('rake', ['--tasks']).stdout)).trim();
    if (stdout) {
      const children = stdout.split('\n').map((line) => {
        const parts = line.split('#');
        const cmd = parts[0].trim();
        return {
          name: _.padEnd(cmd, 25) + ' ' + parts[1].trim(),
          cmd,
          executable: true,
        };
      });

      return {
        name: 'Rake tasks',
        extended: true,
        children,
      };
    }
  } catch (ignore) {}
  return null;
}

export async function getCommandDetail(id) {
  const db = await dbPromise;
  const cmd = await db.get('select * from commands where id = ?', id);
  cmd.schema = JSON.parse(cmd.schema);
  cmd.examples = JSON.parse(cmd.examples);
  return cmd;
}

export async function getCommandByArgs(args) {
  let cmd = null;
  const db = await dbPromise;
  for (let i = 1; i <= args.length; i += 1) {
    let result = await db.get('select id from commands where name = ?;', args.slice(0, i).join(' '));
    if (result && result.id) {
      cmd = result.id;
    } else if (i > 1) {
      break;
    }
  }
  return cmd ? await getCommandDetail(cmd) : null;
}
