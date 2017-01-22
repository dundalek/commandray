import path from 'path';
import React, { Component } from 'react';
import blessed from 'blessed';
import { render } from 'react-blessed';
import { Grid, GridItem } from 'react-blessed-contrib';
import { getCommandDetail } from './model';
import CommandTree from './components/CommandTree';

class App extends Component {
  constructor() {
    super();
    this.state = {
      content: '',
    }
  }

  componentDidMount() {
    this.props.screen.key(['tab'], (ch, key) => {
      const tree = this.refs.tree;
      const table = this.refs.table;
      if(screen.focused == table)
        tree.focus();
      else
        table.focus();
    });
    this.refs.tree.focus();
  }

  render() {
    return (
      <Grid rows={1} cols={2}>
        <CommandTree ref="tree" row={0} col={0} rowSpan={1} colSpan={1} template={{ lines: true }} onEnter={this._onSelect} onSelect={this._onSelect} />
        <box ref="table" row={0} col={1} rowSpan={1} colSpan={1} label="Informations">{this.state.content}</box>
      </Grid>
    );
  }

  _onSelect = async (node) => {
    let data = `${node.name}\n\n`;

    if (node.id) {
      try {
        const cmd = await getCommandDetail(node.id);
        data = JSON.stringify(cmd, null, 2);
      } catch (e) {
        data = e.toString();
      }
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
