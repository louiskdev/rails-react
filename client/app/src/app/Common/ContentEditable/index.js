/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';

class ContentEditable extends Component {
  constructor() {
    super();
    this.emitChange = this.emitChange.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    const needUpdate = !this.refs.message_input_field
      || (nextProps.html !== this.refs.message_input_field.innerHTML
      && nextProps.html !== this.props.html)
      || this.props.disabled !== nextProps.disabled;
    return needUpdate;
  }

  componentDidUpdate() {
    if (this.refs.message_input_field && this.props.html !== this.refs.message_input_field.innerHTML) {
      // Perhaps React (whose VDOM gets outdated because we often prevent
      // rerendering) did not update the DOM. So we update it manually now.
      // this.refs.message_input_field.innerHTML = this.props.html;
    }
  }

  emitChange(evt) {
    if (!this.refs.message_input_field) {return;}
    const html = this.refs.message_input_field.innerHTML;
    if (this.props.onChange && html !== this.lastHtml) {
      evt.target = { value: html };
      this.props.onChange(html);
    }
    this.lastHtml = html;
  }

  render() {
    const props = {};
    Object.assign(props, this.props);
    delete props.tagName;
    delete props.html;

    const html = this.props.html;

    return (
      <div
        id={this.props.id}
        placeholder='Express yourself...'
        name='text'
        ref='message_input_field'
        className='new-message-input'
        onInput={this.emitChange}
        onKeyPress={this.props.onKeyPress}
        onKeyDown={this.props.onKeyDown}
        onPaste={this.props.onPaste}
        onBlur={this.props.onBlur}
        contentEditable={!this.props.disabled}
        dangerouslySetInnerHTML={{ __html: html }}
       />
    );
  }
}

export default ContentEditable;
