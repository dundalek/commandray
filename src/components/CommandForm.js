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
    if (this.refs.root) {
      this.refs.root.enableKeys();
      this.refs.root.focus();
    }
  }

  render() {
    const options = this.getOptions();

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
      <form {...formOpts} ref="root" height={options.length+3} width="100%-2" onKeypress={this.props.onKeypress}>
        {_.flatten(options.map(({ type, label, name }, i) => {
          return [
            <box class={{
              top: i + 1,
            }} key={`${name}-label`}>{label}</box>,
            type === 'boolean'
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

  getOptions() {
    const { cmd } = this.props;
    const options = cmd.params.map(param => {
      const obj = parseParam(param);
      const name = Object.keys(obj)[0];
      const option = obj[name];

      let label = [];
      if (option.alias) {
        label.push(`-${option.alias}`);
      }
      label.push(`--${name}`);
      label = label.join(', ');
      if (option.paramName) {
        label += ' ' + option.paramName;
      }

      return {
        type: option.type,
        name,
        label,
        option,
      }
    });

    const parts = cmd.usage.split(' ');
    if (parts.length > 2) {
      options.unshift({
        type: 'usage',
        label: parts.slice(2).join(' '),
        name: '_',
      });
    }

    return options;
  }

  getCommand() {
    const { cmd } = this.props;
    const options = this.getOptions();
    const vals = {};
    options.forEach(({ name }) => {
      const val = this.refs[name].value;
      vals[name] = val !== '' ? val : null;
      if (name === '_' && val) {
        vals[name] = [val];
      }
    });

    const text = unparse(cmd, vals);
    return cmd.usage.split(' ').slice(0, 2).concat([text]).join(' ');
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
