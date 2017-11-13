import React, { Component, PropTypes as T } from 'react';
import $ from 'jquery';
import { Picker } from 'emoji-mart';
// import EmojiPicker from 'emojione-picker';

class EmojiPickerWrapper extends Component {

  static propTypes = {
    search: T.bool,
    onChange: T.func.isRequired,
  };

  componentDidMount() {
    const self = this;
    $('.emoji-mart-anchor').on('click', function(e) {
      self.forceUpdate();
    });
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    const { onChange } = this.props;
    return (
      <Picker color='#62db95' emojiSize={24} set='emojione' onClick={onChange} />
    );
  }
}

/* <EmojiPicker search={search} onChange={onChange} /> */

export default EmojiPickerWrapper;
