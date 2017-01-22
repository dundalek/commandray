import path from 'path';
import _ from 'lodash';
import sqlite from 'sqlite';
import React, { Component } from 'react';
import { Tree } from 'react-blessed-contrib';
import { nestItems, truncate } from '../util';

const dbFile = path.join(__dirname, '../../tmp/commands.db');
const dbPromise = sqlite.open(dbFile);

const promisify = func => (...args) => new Promise((resolve, reject) =>
  func(...args, (err, result) => err ? reject(err) : resolve(result)));

var root = {
  name: 'All commands',
  extended: true,
  root: true,
};

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

async function loadChildrenExpand(query) {
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

async function loadChildrenQuery(query) {
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

export default class CommandTree extends Component {
  constructor() {
    super();
    this.state = {
      root,
      query: '',
    }
  }

  componentDidMount() {
    const { tree } = this.refs;
    loadChildrenRoot().then((children) => {
      this.state.root.children = children;
      this._reRender();
    });
    tree.rows.on('select item', this._onSelect);
    tree.rows.on('keypress', this._onListKeypress);
  }

  render() {
    return (
      <Tree {...this.props} ref="tree" label={this.state.query} onSelect={this._onEnter} />
    );
  }

  _onListKeypress = async (ch, key) => {
    let query = this.state.query;
    ch = ch === ' ' ? ch : ch && ch.trim(); // do not allow other whitespace

     if (key.name === 'backspace') {
       query = this.state.query.slice(0, -1);
     } else if (key.name === 'delete') {
       query = '';
     } else  if (ch) {
      query += ch;
     }

     if (query !== this.state.query) {
       this.setState({ query });
       if (query === '') {
         this.setState({ root: root });
         _.defer(this._reRender);
       } else if (query.length >= 3) {
         const queryRoot = {
           name: query,
           cmd: query,
           extended: true,
         };
         this.setState({ root: queryRoot });

         loadChildrenQuery(query).then((children) => {
           queryRoot.children = children;
           this._reRender();
         });
       }
     }
  }

  _onEnter = async (node) => {
    this.props.onEnter(node);

    if (node.children && node.children.__placeholder__) {
      node.children = await loadChildrenExpand(node.cmd);
      this._reRender();
    }
  }

  _onSelect = (item, idx) => {
    const node = this.refs.tree.nodeLines[idx];
    this.props.onSelect(node, idx);
  }

  _reRender = () => {
    const { tree } = this.refs;
    tree.setData(this.state.root);
    tree.screen.render();
  }

  focus() {
    this.refs.tree.focus();
  }
}
