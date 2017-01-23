import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { parseParam, unparse, parse } from '../parser';

export default class CommandForm extends Component {
  static propTypes = {
    cmd: PropTypes.object,
    args: PropTypes.object,
    onSelectCommand: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      text: '',
      activeParam: null,
    };
    // if (props.args) {
    //   // this.state.text = parse(props.cmd, props.args);
    //   this.state.text = props.args.join(' ');
    // }
  }

  componentDidMount() {
    this.refs.root.enableKeys();
  }

  render() {
    const formOpts = {
      ...this.props,
      keys: true,
      // left: 0,
      // top: 0,
      // width: '100%',
      bg: 'green',
      border: {type: 'line'},
      style: {border: {fg: 'cyan'}}
    }

    const submitOpts = {
      mouse: true,
      keys: true,
      shrink: true,
      // padding: {
      //   left: 1,
      //   right: 1
      // },
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

    let params: Param[] = this.props.cmd ? this.props.cmd.schema.params : [];
    params = [{
      name: '_',
      label: this.props.cmd && (this.props.cmd.schema.usage || this.props.cmd.name),
      summary: 'Positional command line arguments',
      description: '',
      schema: {
        type: 'string',
      },
    }, ...params];
    const summary = this.state.activeParam && this.state.activeParam.summary || '';
    return (
      <form key={this.props.cmd ? this.props.cmd.name : null} {...formOpts} ref="root" onKeypress={this.props.onKeypress}>
        {params.map((param, i) => {
          const { name } = param;
          const type = param.schema.type;

          let label = param.label;
          if (!label) {
            label = [];
            if (param.alias && param.alias[0]) {
              label.push(`-${param.alias[0]}`);
            }
            label.push(`--${name}`);
            label = label.join(', ');
          }
          // if (param.paramName) {
          //   label += ' ' + option.paramName;
          // }

          return [
            <box class={{
              top: i + 1,
            }} key={`${name}-label`}>{label}</box>,
            type === 'boolean'
            ? <checkbox class={{
              mouse: true,
              top: i + 1,
              left: '50%',
            }} onSetContent={this._onSubmit} onBlur={() => this.setActiveParam()} onFocus={() => this.setActiveParam(param)} ref={`${name}-input`} key={`${name}-input-checkbox`} />
            : <textbox class={{
              mouse: true,
              keys: true,
              inputOnFocus: true,
              top: i + 1,
              left: '50%',
              width: '50%-1',
              underline: true,
            }} onSetContent={this._onSubmit} onBlur={() => this.setActiveParam()} onFocus={() => this.setActiveParam(param)} ref={`${name}-input`} key={`${name}-input-textbox`} />
          ];
        })}
        <box key="text" top={params.length + 2}>{this.state.text}</box>
        <button key="submit" {...submitOpts} top={params.length + 3} onPress={this._onExec}/>
        <box key="summary" top={params.length + 5}>{summary}</box>
      </form>
    );
  }

  getCommand() {
    const { cmd } = this.props;
    const vals = {};
    cmd.schema.params.forEach(({ name }) => {
      const val = this.refs[`${name}-input`].value;
      vals[name] = val !== '' ? val : null;
    });
    const val = this.refs['_-input'].value;
    if (val) {
      vals._ = [val];
    }

    const text = unparse(cmd, vals);
    return `${cmd.name} ${text}`;
  }

  setActiveParam(activeParam) {
    this.setState({ activeParam });
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

  focus() {
    this.refs.root.focus();
  }
}
