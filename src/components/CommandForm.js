import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { parseParam, unparse, parse } from '../parser';
import blessed from 'blessed';

export default class CommandForm extends Component {
  static propTypes = {
    cmd: PropTypes.object,
    args: PropTypes.array,
    onSelectCommand: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      text: '',
      activeParam: null,
      values: {},
    };
    if (props.cmd && props.args) {
      this.state.values = parse(props.cmd, props.args);
    }
  }

  componentDidMount() {
    this.refs.root.enableKeys();
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.props.cmd !== nextProps.cmd || this.props.args !== nextProps.args) {
      let values = {};
      if (nextProps.cmd) {
        values = parse(nextProps.cmd, nextProps.args);
      }
      this.setState({ values });
    }
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
    let text = this.state.text;
    if (this.props.cmd) {
      text = this.getCommand();
    }
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
              checked: !!this.state.values[name],
            }} onSetContent={this._onSubmit} onBlur={() => this.setActiveParam()} onFocus={() => this.setActiveParam(param)} ref={`${name}-input`} key={`${name}-input-checkbox`} />
            : <textbox class={{
              mouse: true,
              keys: true,
              inputOnFocus: true,
              top: i + 1,
              left: '50%',
              width: '50%-1',
              underline: true,
              value: this.state.values[name] ? `${this.state.values[name]}` : '',
            }} onSetContent={this._onSubmit} onBlur={() => this.setActiveParam()} onFocus={() => this.setActiveParam(param)} ref={`${name}-input`} key={`${name}-input-textbox`} />
          ];
        })}
        <box key="text" top={params.length + 2}>{text}</box>
        <button key="submit" {...submitOpts} top={params.length + 3} onPress={this._onExec}/>
        <box key="summary" top={params.length + 5}>{summary}</box>
      </form>
    );
  }

  getCommand() {
    const { cmd } = this.props;
    return unparse(cmd, this.state.values);
  }

  setActiveParam(activeParam) {
    this.setState({ activeParam });
  }

  _onSubmit = (evs) => {
    const { activeParam } = this.state;

    if (activeParam) {
      const name = activeParam.name;
      let val = this.refs[`${name}-input`].value;
      val = val !== '' ? val : null;
      if (name === '_' && val) {
        val = [val];
      }

      const nextValues = {};
      nextValues[name] = val;
      if (activeParam.alias) {
        const alias = typeof activeParam.alias === 'string' ? [activeParam.alias] : activeParam.alias;
        alias.forEach(a => nextValues[a] = val);
      }
      // update directly and not via setState because re-redering messes up inputs' internal state
      this.state.values = {
        ...this.state.values,
        ...nextValues,
      };
      const text = this.getCommand();
      if (text !== this.state.text) {
        this.setState({ text });
      }
    }
  }

  _onExec = (ev) => {
    this.props.onSelectCommand(this.getCommand());
  }

  focus() {
    this.refs.root.focus();
  }
}
