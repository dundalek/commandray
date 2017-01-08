import _ from 'lodash';
import React, { Component } from 'react';
import { Grid, Tree } from 'react-blessed-contrib';
import CommandForm from './CommandForm';
import commands from '../commands';

const items = [['','']].concat(_.map(commands, cmd => [cmd.name, cmd.desc || '']));

const stylesheet = {
  list: {
    selected: {
      fg: 'green'
    },
  },
  listtable: {
    cell: {
      selected: {
        fg: 'green'
      }
    },
    header: {
      invisible: true
    }
  }
};

function buildCommandTree(commands) {
  return _(commands)
    .groupBy(v => v.name.split(':')[0])
    .map((v, k) => {
      return {
        name: k,
        children: v.map(n => ({ name: n.name }))
      };
    })
    .value();
}

// const primaryTopics = _.keyBy(['addons', 'apps', 'auth', 'config', 'domains', 'logs', 'ps', 'releases', 'run']);
// commandTree = [{
//   name: 'Primary topics',
//   extended: true,
//   children: commandTree.filter(x => x.name in primaryTopics)
// }, {
//   name: 'Additional topics',
//   extended: true,
//   children: commandTree.filter(x => !(x.name in primaryTopics))
// }];

const explorer = {
  name: '',
  extended: true,
  children: buildCommandTree(commands)
}

const elementList = ['mylist', 'text'];
export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      text: '',
      selected: 1,
      focused: 0,
      showDetail: false,
    };
    this.preventEvent = 0;
    // if (props.args[1] in commands) {
    //   this.state.selected = _.findIndex(items, x => x[0] === props.args[1]);
    //   this.state.showDetail = true;
    // } else {
    //   this.state.text = props.args.join(' ');
    // }
  }

  componentDidMount() {
    // this.refs.tree.setData(explorer);
    let c;
    c = this.refs[elementList[this.state.focused]]
    if (c) c.focus();
  }

  componentDidUpdate() {
    if (!this.state.showDetail) {
      let c;
      c = this.refs.mylist;
      if (c && this.state.selected !== 1) c.select(this.state.selected);
      _.defer(() => {
        c = this.refs[elementList[this.state.focused]];
        if (c) c.focus();
      });
    }
  }

  render() {
    let filteredItems = items;
    if (this.state.text) {
      const r = new RegExp(this.state.text, 'i');
      const matched = {};
      ['name', 'desc', 'docs'].forEach(key => {
        if (key === 'docs' && !_.isEmpty(matched)) return;
        _.each(commands, c => {
          if (r.test(c[key]) && !matched[c.name]) {
            matched[c.name] = c;
          }
        });
      });
      filteredItems = [['','']].concat(_.map(matched, (cmd) => [cmd.name, cmd.desc || '']));
    }
    const item = filteredItems[this.state.selected] || filteredItems[1];
    let cmd = {};
    let doc = '';
    if (item && item[0]) {
      cmd = commands[item[0]];
      doc = cmd.docs;
      // doc = JSON.stringify(_.omit(cmd, 'docs'), null, 2) + '\n\n' + cmd.docs;
    }

    const commandList = <Tree ref="tree" row={0} col={0} rowSpan={2} colSpan={1} {...{
      style: {
        text: "red"
      },
      template: {
        lines: true
      },
      label: 'Filesystem Tree',
      "onSelect Item": (node) => { console.log(node) }
    }}/>

    // const commandList = <listtable key="listtable" ref="mylist" row={0} col={0} colSpan={1} rowSpan={2} style={stylesheet.listtable} data={filteredItems} mouse={true} keys={true} interactive={true} align="left" noCellBorders={true} label={this.state.text}
    //      onSelect={this._onSelectEnter}
    //      onSelectItem={this._onSelect}
    //      onKeypress={this._onListKeypress}
    //   />


    return (
      <Grid cols={1} rows={4} component="box">
      {/*  */}
      {this.state.showDetail
        ? <CommandForm  key="CommandForm" row={0} col={0} colSpan={1} rowSpan={2} onKeypress={this._onDetailKeypress} onSelectCommand={this.props.onSelectCommand} cmd={cmd} args={this.props.args} />
        : commandList}

        <box key="text" ref="text" row={2} col={0} colSpan={1} rowSpan={2} border={{type: 'line'}} style={{border: {fg: 'cyan'}}} scrollable={true} mouse={true} keys={true} input={true} alwaysScroll={true} scrollbar={{ch: " ", inverse: true}} onKeypress={this._onKeypress}>
          {doc}
        </box>
      </Grid>
    );
  }

  _onDetailKeypress = (ch, key) => {
    if (key.name === 'escape') {
      this.setState({ showDetail: false, focused: 0 });
    }
  }

  _onSelectEnter = () => {
    this.preventEvent = 2;
    this.setState({ showDetail: true, focused: 1 });
  }

  _onKeypress = (ch, key) => {
    if (key.name === 'tab') {
      this.setState({
        focused: (this.state.focused + 1) % elementList.length
      })
    }
  }

  _onListKeypress = (ch, key) => {
    this._onKeypress(ch, key);

   if (key.name === 'backspace') {
     this.setState({ text: this.state.text.slice(0, -1) });
   } else if (key.name === 'delete') {
     this.setState({ text: '' });
   } else  if (ch && ch.trim()) {
      this.setState({
        text: this.state.text + ch.trim()
      });
    }
  }

  _onSelect = (item, idx) => {
    // console.log('select', this.state.selected, idx);
    if (idx === this.state.selected || idx === 0 || (idx === 1 && this.preventEvent-- > 0)) return;

    // workaround skip next two events
    // first get fired when component is rerendered
    // second gets fired when we correct selection in componentDidUpdate
    this.preventEvent = 2;
    //
     this.setState({ selected: idx });
    //  this.refs.mylist.select(idx);
  }
}
