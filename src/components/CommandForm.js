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

    const params = this.props.cmd ? this.props.cmd.schema.params : [];
    const summary = this.state.activeParam && this.state.activeParam.summary || '';
    return (
      <form key={this.props.cmd ? this.props.cmd.name : null} {...formOpts} ref="root" onKeypress={this.props.onKeypress}>
        {_.flatten(params.map((param, i) => {
          const { name } = param;
          const type = param.schema.type;

          let label = [];
          if (param.alias && param.alias[0]) {
            label.push(`-${param.alias[0]}`);
          }
          label.push(`--${name}`);
          label = label.join(', ');
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
        }))}
        <box key="text" top={params.length + 2}>{this.state.text}</box>
        <button key="submit" {...submitOpts} top={params.length + 3} onPress={this._onExec}/>
        <box key="summary" top={params.length + 5}>{summary}</box>
      </form>
    );
  }

  // getOptions() {
  //   const { cmd } = this.props;
  //   const options = cmd.schema.params.map((param: Param) => {
  //     const obj = parseParam(param);
  //     const name = Object.keys(obj)[0];
  //     const option = obj[name];
  //
  //     let label = [];
  //     if (option.alias) {
  //       label.push(`-${option.alias}`);
  //     }
  //     label.push(`--${name}`);
  //     label = label.join(', ');
  //     if (option.paramName) {
  //       label += ' ' + option.paramName;
  //     }
  //
  //     return {
  //       type: option.type,
  //       name,
  //       label,
  //       option,
  //     }
  //   });
  //
  //   const parts = cmd.usage.split(' ');
  //   if (parts.length > 2) {
  //     options.unshift({
  //       type: 'usage',
  //       label: parts.slice(2).join(' '),
  //       name: '_',
  //       option: {},
  //     });
  //   }
  //
  //   return options;
  // }

  getCommand() {
    const { cmd } = this.props;
    const vals = {};
    cmd.schema.params.forEach(({ name }) => {
      const val = this.refs[`${name}-input`].value;
      vals[name] = val !== '' ? val : null;
      if (name === '_' && val) {
        vals[name] = [val];
      }
    });

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
