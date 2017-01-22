import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { Tree } from 'react-blessed-contrib';
import { getRootNode, getQueryNode, loadChildrenExpand } from '../model';

export default class CommandTree extends Component {
  static propTypes = {
    onEnter: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
  }

  constructor() {
    super();
    this.state = {
      query: '',
      root: { name: 'Loading...' }
    }
  }

  componentDidMount() {
    const { tree } = this.refs;
    tree.rows.on('select item', this._onSelect);
    tree.rows.on('keypress', this._onListKeypress);
    getRootNode().then(this._reRender);
  }

  render() {
    return (
      <Tree {...this.props} ref="tree" label={this.state.query} onSelect={this._onEnter} />
    );
  }

  _onListKeypress = async (ch, key) => {
    let query = this.state.query;
    ch = ch === ' ' ? ch : ch && ch.trim(); // do not allow other whitespace

     if (key.name === 'backspace') {
       query = this.state.query.slice(0, -1);
     } else if (key.name === 'delete') {
       query = '';
     } else  if (ch) {
      query += ch;
     }

     if (query !== this.state.query) {
       this.setState({ query });
       if (query === '') {
         this._reRender(await getRootNode());
       } else if (query.length >= 3) {
         this._reRender(await getQueryNode(query));
       }
     }
  }

  _onEnter = async (node) => {
    this.props.onEnter(node);

    if (node.children && node.children.__placeholder__) {
      node.children = await loadChildrenExpand(node.cmd);
      this._reRender();
    }
  }

  _onSelect = (item, idx) => {
    const node = this.refs.tree.nodeLines[idx];
    this.props.onSelect(node, idx);
  }

  _reRender = (root) => {
    if (root) {
      this.setState({ root });
    }
    const { tree } = this.refs;
    tree.setData(root || this.state.root);
    tree.screen.render();
  }

  focus() {
    this.refs.tree.focus();
  }
}
