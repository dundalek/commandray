import _ from 'lodash';
import React, { Component } from 'react';
import CommandForm from './CommandForm';

const commands = require('../../commands.json');
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

class InnerBox extends Component {
  constructor(props) {
    super(props);
  }

  render() {
  }
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
  }

  componentDidMount() {
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
      // doc = cmd.docs;
      doc = JSON.stringify(_.omit(cmd, 'docs'), null, 2) + '\n\n' + cmd.docs;
    }

    return (
      <box label={`${this.state.selected} ${this.state.text}`}
           border={{type: 'line'}}
           style={{border: {fg: 'cyan'}}}>
        {/* <list ref="mylist" style={stylesheet.list} items={items} mouse={true} keys={true} interactive={true} vi={true} /> */}
        {this.state.showDetail
          ? <CommandForm onKeypress={this._onDetailKeypress} onSelectCommand={this.props.onSelectCommand} cmd={cmd} />
          : <listtable ref="mylist" style={stylesheet.listtable} data={filteredItems} mouse={true} keys={true} interactive={true} align="left" height="20%"
           onSelect={this._onSelectEnter}
           onSelectItem={this._onSelect}
           onKeypress={this._onListKeypress}
        />}

        <box ref="text" height="80%-2" top="20%" width="100%-2" border={{type: 'line'}} style={{border: {fg: 'cyan'}, track: {fg: 'cyan'}}} scrollable={true} mouse={true} keys={true} alwaysScroll={true} scrollbar={{bg: 'blue'}} onKeypress={this._onKeypress}>
        {doc}
        </box>
      </box>
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
