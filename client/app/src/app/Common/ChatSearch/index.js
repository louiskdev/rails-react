/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import debounce from 'lodash.debounce';
import hoc from './hoc';

class ChatSearch extends Component {

  static contextTypes = {
    userChannel: React.PropTypes.object,
  }

  subscribeToPusher = () => {
    const channel = this.context.userChannel;
    channel.bind('important', this.refresh);
    channel.bind('avatar_changed', this.refresh);
    channel.bind('friend_avatar_changed', this.refresh);
  }

  unsubscribeFromPusher = () => {
    const channel = this.context.userChannel;
    channel.unbind('important', this.refresh);
    channel.unbind('avatar_changed', this.refresh);
    channel.unbind('friend_avatar_changed', this.refresh);
  }

  refresh = () => {
    this.props.data.refetch();
  }

  onChange = debounce((value) => {
    const { onKeywordChange } = this.props;
    if (onKeywordChange) {
      onKeywordChange(value);
    }
  }, 500);

  componentDidMount() {
    this.subscribeToPusher();
  }

  componentWillUnmount() {
    this.unsubscribeFromPusher();
  }

  render() {
    const { open, onSelectFriend } = this.props;
    const searchIconStyle = {
      width: 22,
      height: 22,
    };
    const contentWrapperStyle = {
      position: 'relative',
      zIndex: 10000,
    };
    const contentBgStyle = {
      position: 'fixed',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
    };
    const { currentUser } = this.props.data;
    const friends = currentUser ? currentUser.friends.edges : [];
    return (
      <div className={'myb-chatbar-searchbox myb-chatbar-box search ' + (open ? 'open' : '')}>
        <div style={contentWrapperStyle}>
          <div className='myb-chatbar-search-input'>
            <input type='text' placeholder='Type name here...' onChange={(event) => {
              event.persist();
              this.onChange(event.currentTarget.value);
            }} />
          </div>

          <div className='myb-chatbar-search-results'>
            <div className='myb-chatbar-search-results-inner'>
              {friends.map((friend, index) => (
                <a key={index} href='javascript:void(0)' onClick={onSelectFriend.bind(this, friend.node.id)} style={{ display: 'block' }}>
                  <div className='myb-chatbar-search-result mui--clearfix'>
                    <img src={friend.node.avatar_url} />
                    <span>{friend.node.username}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div style={contentBgStyle} onClick={this.props.onClose} />
      </div>
    );
  }
}

export default hoc(ChatSearch);
