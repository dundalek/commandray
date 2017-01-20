import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import sqlite from 'sqlite';
import React, {Component} from 'react';
import blessed from 'blessed';
import {render} from 'react-blessed';
import { Grid, GridItem, Tree, Table } from 'react-blessed-contrib';
import { nestItems } from './util';

const dbFile = path.join(__dirname, '../tmp/commands.db');
let db;

const promisify = func => (...args) => new Promise((resolve, reject) =>
  func(...args, (err, result) => err ? reject(err) : resolve(result)));

var root = {
  name: 'All commands',
  extended: true,
  root: true,
};

function mapChildren(children) {
  return _(children)
    .map((child) => {
      const ret = {
        ...child,
        name: child.id ? `${child.name_orig || child.name} (${child.id})` : (child.name_orig || child.name || child.basename),
        extended: false,
      };
      if (child.children) {
        ret.children = mapChildren(child.children);
      }
      return ret;
    })
    // .keyBy((c) => c.id || c.name)
    .value();
}

async function loadChildren(self, cb) {
  if (!db) {
    db = await sqlite.open(dbFile);
  }

  let children;

  if (self.root) {
    const args = {
      $len: 0
    };
    children = await db.all(`
      select
        substr(name_clean, 0, case when instr(substr(name_clean, $len + 1), ' ') then instr(substr(name_clean, $len + 1), ' ') + $len else length(name_clean)+1 end) as basename,
        count(*) as cnt
      from commands
      group by basename
      order by cnt desc
      limit 1000
    `, args);

    children = _(children)
      .map((child) => {
        return {
          ...child,
          name: child.id ? `${child.name_clean || child.name} (${child.id})` : (child.name_clean || child.name || child.basename),
          extended: false,
          children: (child.cnt && child.cnt > 1) ? { __placeholder__: { name: 'Loading...' } } : null,
        };
      })
      // .keyBy((c) => c.id || c.name)
      .value();
  } else {
    const args = {
      $cmd: self.name,
      $cmdPrefix: self.name + ' %',
    };

    children = await db.all(`
      select
        id,
        name as name_orig,
        name_clean as name
      from commands
      where name = $cmd or name like $cmdPrefix
      order by name asc
    `, args);

    children = nestItems(children);
    if (children.length === 1) {
      children = children[0].children;
    }
    children = mapChildren(children);
  }

  self.children = children;
  cb();
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      content: ''
    }
  }

  componentDidMount() {
    this.props.screen.key(['tab'], (ch, key) => {
      const tree = this.refs.tree;
      const table = this.refs.table;
      if(screen.focused == tree.rows)
        table.focus();
      else
        tree.focus();
    });
    this.refs.tree.focus();
    loadChildren(root, this._reRender);
  }

  render() {
    return (
      <Grid rows={1} cols={2}>
        <Tree ref="tree" row={0} col={0} rowSpan={1} colSpan={1} options={{
          style: {
            text: "red"
          },
          template: {
            lines: true
          },
          label: 'Filesystem Tree',
          onSelect: this._onSelect
        }}/>
        <box ref="table" row={0} col={1} rowSpan={1} colSpan={1} label="Informations">{this.state.content}</box>
      </Grid>
    );
  }

  _reRender = () => {
    this.refs.tree.setData(root);
    screen.render();
  }

  _onSelect = async (node) => {
    let data = `${node.name}\n\n`;

    if (node.id) {
      try {
        const cmd = await db.get('select * from commands where id = ?', node.id);
        data = JSON.stringify(cmd, null, 2);
      } catch (e) {
        data = e.toString();
      }
    } else if (node.children && node.children.__placeholder__) {
      loadChildren(node, this._reRender);
    }

    this.setState({ content: data });
  }
}

var screen = blessed.screen()
screen.key([
  'escape', 'q', 'C-c'
], function(ch, key) {
  return process.exit(0);
});

render(<App screen={screen}/>, screen);
