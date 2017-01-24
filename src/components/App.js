import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { Grid, Tree } from 'react-blessed-contrib';
import CommandForm from './CommandForm';
import CommandTree from './CommandTree';
import { getCommandDetail, getCommandByArgs } from '../model';

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
  static propTypes = {
    args: PropTypes.array,
    onSelectCommand: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      content: '',
      cmd: null,
      args: props.args,
      query: props.args.join(' '),
    };
    if (props.args && props.args.length > 0) {
      getCommandByArgs(props.args).then((cmd) => {
        this.setState({ cmd, query: cmd.name });
      });
    }
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
        <CommandForm  key="form" ref="form" row={0} col={0} colSpan={cmd ? 1 : 0} rowSpan={2} onKeypress={this._onDetailKeypress} onSelectCommand={this.props.onSelectCommand} cmd={this.state.cmd} args={this.state.args} />
        <CommandTree key="tree" ref="tree" row={0} col={0} colSpan={cmd ? 0 : 1} rowSpan={2}  template={{ lines: true }} query={this.state.query} onEnter={this._onSelectEnter} onSelect={this._onSelect} />
        <box key="text" ref="text" row={2} col={0} colSpan={1} rowSpan={2} border={{type: 'line'}} style={{border: {fg: 'cyan'}}} scrollable={true} mouse={true} keys={true} input={true} alwaysScroll={true} scrollbar={{ch: " ", inverse: true}}>
          {this.state.content}
        </box>
      </Grid>
    );
  }

  _onDetailKeypress = (ch, key) => {
    if (key.name === 'escape') {
      this.setState({ cmd: null, args: [] });
    }
  }

  _onSelectEnter = async (node) => {
    if (node.id) {
      const cmd = await getCommandDetail(node.id);
      this.setState({ cmd });
    } else if (node.executable) {
      this.props.onSelectCommand(node.cmd);
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
