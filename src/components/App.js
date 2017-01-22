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
      // focused: 0,
      content: '',
      cmd: null,
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
    screen.key(['tab'], this._handleFocus);
    this.refs.tree.focus();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.cmd && !this.state.cmd) {
      _.defer(() => {
        this.refs.tree.focus()
        this.refs.text.screen.render();
      });
    } else if (!prevState.cmd && this.state.cmd) {
      _.defer(() => {
        this.refs.form.focus();
        this.refs.text.screen.render();
      });
    }
  }

  render() {
    const cmd = this.state.cmd;
    return (
      <Grid cols={1} rows={4} component="box">
        <CommandForm  key="form" ref="form" row={0} col={0} colSpan={cmd ? 1 : 0} rowSpan={2} onKeypress={this._onDetailKeypress} onSelectCommand={this.props.onSelectCommand} cmd={this.state.cmd} />
        <CommandTree key="tree" ref="tree" row={0} col={0} colSpan={cmd ? 0 : 1} rowSpan={2}  template={{ lines: true }} onEnter={this._onSelectEnter} onSelect={this._onSelect} />
        <box key="text" ref="text" row={2} col={0} colSpan={1} rowSpan={2} border={{type: 'line'}} style={{border: {fg: 'cyan'}}} scrollable={true} mouse={true} keys={true} input={true} alwaysScroll={true} scrollbar={{ch: " ", inverse: true}}>
          {this.state.content}
        </box>
      </Grid>
    );
  }

  _onDetailKeypress = (ch, key) => {
    if (key.name === 'escape') {
      this.setState({ cmd: null });
    }
  }

  _onSelectEnter = async (node) => {
    if (node.id) {
      const cmd = await getCommandDetail(node.id);
      this.setState({ cmd });
    }
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

  _handleFocus = (ch, key) => {
    const text = this.refs.text;
    const screen = text.screen;
    if (screen.focused == text) {
      this.refs[this.state.cmd ? 'form' : 'tree'].focus();
    } else {
      text.focus();
    }
  }
}
