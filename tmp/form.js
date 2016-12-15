import React, { Component } from 'react';
import blessed from 'blessed';
import { render } from 'react-blessed';
import _ from 'lodash';
import { transformUsage, parseParam, unparse } from './parser';

const commands = require('./commands.json');
const cmd = commands['apps:create'];
const usage = transformUsage(cmd.usage);
const options = cmd.params.map(parseParam);//.reduce(_.assign, {});

const stylesheet = {
  textbox1: {
    mouse: true,
    keys: true,
    inputOnFocus: true,
    top: 1,
  },
  textbox2: {
    mouse: true,
    keys: true,
    inputOnFocus: true,
    top: 2,
  }
};

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      text: 'hello',
      selected: 1,
      focused: 0,
      showDetail: false,
    };
  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  render() {
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
      padding: {
        left: 1,
        right: 1
      },
      top: options.length + 1,
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
      <form {...formOpts}>
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
            }}>{label}</box>,
            obj.type === 'boolean'
            ? <checkbox class={{
              mouse: true,
              top: i + 1,
              left: '50%',
              onKeypress: this._onSubmit,
            }} ref={name} />
            : <textbox class={{
              mouse: true,
              keys: true,
              inputOnFocus: true,
              top: i + 1,
              left: '50%',
              onKeypress: this._onSubmit,
            }} ref={name} />
          ];
        }))}
        <button {...submitOpts} onPress={this._onSubmit}/>
        <box top={options.length + 2}>{this.state.text}</box>
      </form>
    );
  }

  _onSubmit = (ev) => {
    const vals = {};
    options.forEach(option => {
      const name = Object.keys(option)[0];
      const obj = option[name];

      const val = this.refs[name].value;
      vals[name] = val !== '' ? val : null;
    });

    this.setState({ text: unparse(vals, options) });
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
  return process.exit(0);
});

const component = render(<App />, screen);
