import React, { Component } from 'react';
import blessed from 'blessed';
import { render } from 'react-blessed';
import _ from 'lodash';
import robot from 'robotjs';
import { transformUsage, parseParam, unparse } from './parser';

// https://github.com/Yomguithereal/react-blessed/issues/24
// mouse and enableKeys

const commands = require('../commands.json');
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

class Detail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
    };
  }

  componentDidMount() {
    this.refs.root.enableKeys();
    this.refs.root.focus();
  }

  render() {
    const options = this.props.cmd.params.map(parseParam);

    const formOpts = {
      keys: true,
      left: 0,
      top: 0,
      width: '100%',
      height: options.length + 5,
      bg: 'green',
    }

    const submitOpts = {
      mouse: true,
      keys: true,
      shrink: true,
      // padding: {
      //   left: 1,
      //   right: 1
      // },
      top: options.length + 3,
      shrink: true,
      name: 'submit',
      content: 'submit',
      style: {
        bg: 'blue',
        focus: {
          bg: 'red'
        },
        hover: {
          bg: 'red'
        }
      }
    }

    return (
      <form {...formOpts} ref="root" height="50%" onKeypress={this.props.onKeypress}>
        {_.flatten(options.map((option, i) => {
          const name = Object.keys(option)[0];
          const obj = option[name];

          let label = [];
          if (obj.alias) {
            label.push(`-${obj.alias}`);
          }
          label.push(`--${name}`);
          label = label.join(', ');

          return [
            <box class={{
              top: i + 1,
            }} key={`${name}-label`}>{label}</box>,
            obj.type === 'boolean'
            ? <checkbox class={{
              mouse: true,
              top: i + 1,
              left: '50%',
            }} onSetContent={this._onSubmit} ref={name} key={`${name}-input`} />
            : <textbox class={{
              mouse: true,
              keys: true,
              inputOnFocus: true,
              top: i + 1,
              left: '50%',
              width: '50%-1',
              underline: true,
            }} onSetContent={this._onSubmit} ref={name} key={`${name}-input`} />
          ];
        }))}
        <box top={options.length + 2}>{this.state.text}</box>
        <button {...submitOpts} onPress={this._onExec}/>
      </form>
    );
  }

  getCommand() {
    const options = this.props.cmd.params.map(parseParam);
    const vals = {};
    options.forEach(option => {
      const name = Object.keys(option)[0];
      const obj = option[name];

      const val = this.refs[name].value;
      vals[name] = val !== '' ? val : null;
    });

    const text = unparse(vals, options);
    return ['heroku', this.props.cmd.name, text].join(' ');
  }

  _onSubmit = (ev) => {
    const text = this.getCommand();
    if (text !== this.state.text) {
      this.setState({ text });
    }

  }

  _onExec = (ev) => {
    const text = this.getCommand();
    screen.destroy();
    robot.typeString(text);
    // robot.keyTap('enter');
    process.exit(0);
  }
}

const elementList = ['mylist', 'text'];
class App extends Component {

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
      if (c) c.select(this.state.selected);
      c = this.refs[elementList[this.state.focused]];
      if (c) c.focus();
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
    if (item) {
      cmd = commands[item[0]];
      // doc = cmd.docs;
      doc = JSON.stringify(_.omit(cmd, 'docs'), null, 2) + '\n\n' + cmd.docs;
    }

    return (
      <box label={this.state.selected + ' ' + this.state.text}
           border={{type: 'line'}}
           style={{border: {fg: 'cyan'}}}>
        {/* <list ref="mylist" style={stylesheet.list} items={items} mouse={true} keys={true} interactive={true} vi={true} /> */}
        {this.state.showDetail
          ? <Detail onKeypress={this._onDetailKeypress} cmd={cmd} />
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
      // this.preventEvent = 2;
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
    if (idx === 0 || idx === this.state.selected || this.preventEvent-- > 0) return;

    // workaround skip next two events
    // first get fired when component is rerendered
    // second gets fired when we correct selection in componentDidUpdate
    this.preventEvent = 2;
    //
     this.setState({ selected: idx });
    //  this.refs.mylist.select(idx);
  }
}

class InnerBox extends Component {
  constructor(props) {
    super(props);
  }

  render() {
  }
}

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: 'react-blessed demo app'
});

screen.key(['q', 'C-c'], function(ch, key) {
  process.exit(0);
});

const component = render(<App />, screen);
