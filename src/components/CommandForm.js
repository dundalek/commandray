import _ from 'lodash';
import React, { Component } from 'react';
import { parseParam, unparse } from '../parser';

export default class CommandForm extends Component {
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
      <form {...formOpts} ref="root" height={options.length+3} width="100%-2"onKeypress={this.props.onKeypress}>
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
            }} onSetContent={this._onSubmit} ref={name} key={`${name}-input-checkbox`} />
            : <textbox class={{
              mouse: true,
              keys: true,
              inputOnFocus: true,
              top: i + 1,
              left: '50%',
              width: '50%-1',
              underline: true,
            }} onSetContent={this._onSubmit} ref={name} key={`${name}-input-textbox`} />
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

    const text = unparse(this.props.cmd, vals);
    return ['heroku', this.props.cmd.name, text].join(' ');
  }

  _onSubmit = (ev) => {
    const text = this.getCommand();
    if (text !== this.state.text) {
      this.setState({ text });
    }

  }

  _onExec = (ev) => {
    this.props.onSelectCommand(this.getCommand());
  }
}
