import _ from 'lodash';
import React, { Component } from 'react';
import { Grid, Tree } from 'react-blessed-contrib';
import CommandForm from './CommandForm';
import CommandTree from './CommandTree';
import { getCommandDetail } from '../model';

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

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      focused: 0,
      showDetail: false,
      content: ''
    };
    // if (props.args[1] in commands) {
    //   this.state.selected = _.findIndex(items, x => x[0] === props.args[1]);
    //   this.state.showDetail = true;
    // } else {
    //   this.state.text = props.args.join(' ');
    // }
  }

  componentDidMount() {
    const screen = this.refs.text.screen;
    screen.key(['tab'], (ch, key) => {
      const tree = this.refs.tree;
      const text = this.refs.text;
      if(screen.focused == text)
        tree.focus();
      else
        text.focus();
    });
    this.refs.tree.focus();
  }

  componentDidUpdate() {
    // if (!this.state.showDetail) {
    //   let c;
    //   c = this.refs.mylist;
    //   if (c && this.state.selected !== 1) c.select(this.state.selected);
    //   _.defer(() => {
    //     c = this.refs[elementList[this.state.focused]];
    //     if (c) c.focus();
    //   });
    // }
  }

  render() {
    return (
      <Grid cols={1} rows={4} component="box">
        {this.state.showDetail
          ? <CommandForm  key="CommandForm" row={0} col={0} colSpan={1} rowSpan={2} onKeypress={this._onDetailKeypress} onSelectCommand={this.props.onSelectCommand} cmd={cmd} args={this.props.args} />
          : <CommandTree ref="tree" row={0} col={0} rowSpan={2} colSpan={1} template={{ lines: true }} onEnter={this._onSelectEnter} onSelect={this._onSelect} />
        }

        <box key="text" ref="text" row={2} col={0} colSpan={1} rowSpan={2} border={{type: 'line'}} style={{border: {fg: 'cyan'}}} scrollable={true} mouse={true} keys={true} input={true} alwaysScroll={true} scrollbar={{ch: " ", inverse: true}}>
          {this.state.content}
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
    // this.preventEvent = 2;
    // this.setState({ showDetail: true, focused: 1 });
  }

  _onSelect = async (node) => {
    let content = `${node.name}\n\n`;

    if (node.id) {
      try {
        const cmd = await getCommandDetail(node.id);
        content = cmd.description || cmd.summary;
        // content = JSON.stringify(cmd, null, 2);
      } catch (e) {
        content = e.toString();
      }
    }

    this.setState({ content });
  }
}
