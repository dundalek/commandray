import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import sqlite from 'sqlite';
import React, {Component} from 'react';
import blessed from 'blessed';
import {render} from 'react-blessed';
import { Grid, GridItem, Tree, Table } from 'react-blessed-contrib';

const dbFile = path.join(__dirname, '../tmp/commands.db');
let db;

const promisify = func => (...args) => new Promise((resolve, reject) =>
  func(...args, (err, result) => err ? reject(err) : resolve(result)));

var root = {
  name: 'All commands',
  extended: true,
  cmd: '',
};

async function loadChildren(self, cb) {
  if (!db) {
    db = await sqlite.open(dbFile);
  }

  var whereClause = '';
  var args = {
    $len: self.cmd ? self.cmd.length + 1 : 0
  };
  if (self.cmd) {
    whereClause =  'where name = $cmd or name like $cmdPrefix';
    args.$cmd = self.cmd
    args.$cmdPrefix = self.cmd + ' %';
  }

  const children = await db.all(`
    select
      substr(name, 0, case when instr(substr(name, $len + 1), ' ') then instr(substr(name, $len + 1), ' ') + $len else length(name)+1 end) as basename,
      count(*) as cnt
    from commands
    ${whereClause}
    group by basename
    order by cnt desc
    limit 1000
  `, args);

  // console.log(children);

  self.children = _(children)
    .map((child) => {
      if (child.cnt && child.cnt > 1) {
        // If it's a directory we generate the child with the children generation function
        return {
          name: child.basename,
          cmd: child.basename,
          extended: false,
          children: { __placeholder__: { name: 'Loading...' } }
        };
      } else {
        // Otherwise children is not set (you can also set it to "{}" or "null" if you want)
        return {
          name: child.basename,
          cmd: child.basename,
          extended: false
        };
      }
    })
    .keyBy('name')
    .value();

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
    var data = `${node.name}\n\n`;

    if (node.children) {
      loadChildren(node, this._reRender);
    } else {
      const cmd = await db.get('select * from commands where name = ?', node.cmd);
      data = JSON.stringify(cmd, null, 2);
    }

    try {
      // Add results
      // data += JSON.stringify(await promisify(fs.lstat)(path), null, 2);
    } catch (e) {
      data = e.toString();
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

// async function main() {
//   db = await sqlite.open(dbFile);
//
//   const self = {
//     cmd: 'heroku'
//   };
//
//   var whereClause = '';
//   var args = {
//     $len: self.cmd ? self.cmd.length + 1 : 0
//   };
//   if (self.cmd) {
//     whereClause =  'where name = $cmd or name like $cmdPrefix';
//     args.$cmd = self.cmd
//     args.$cmdPrefix = self.cmd + ' %';
//   }
//
//   const children = await db.all(`
//     select
//       substr(name, 0, case when instr(substr(name, $len + 1), ' ') then instr(substr(name, $len + 1), ' ') + $len else length(name)+1 end) as basename,
//       count(*) as cnt
//     from commands
//     ${whereClause}
//     group by basename
//     order by cnt desc
//   `, args);
//
//   // const children = await db.all(`
//   //   select
//   //     substr($name, 0, case when instr(substr($name, $len+1), ' ') then instr(substr($name, $len+1), ' ') + $len else length($name)+1 end) as result;
//   // `, {
//   //   $name: 'heroku add a',
//   //   $len: 'heroku add'.length + 1
//   // });
//
//   console.log(children);
// }
//
// main().then(x => console.log(x)).catch(x => console.error(x));
