/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import Avatar from 'material-ui/Avatar';
import { Link } from 'react-router';
import { ListItem } from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import IconSocialPeople from 'material-ui/svg-icons/social/people';
import IconActionFavorite from 'material-ui/svg-icons/action/favorite';

class SearchItem extends Component {

  render() {
    const searchNode = this.props.node;

    let results = null;
    const searchButtonsStyle = {
      borderRadius: 999,
      color: '#62db95',
      border: '1px solid #62db95',
      marginLeft: 8,
      lineHeight: 1,
    };
    const titleStyle = {
      fontSize: 15,
      color: '#2F3B4D',
    };

    if (this.props.quickSearch) {
      if (this.props.type === 'user') {
        const title = <Link to={`/u/${searchNode.username}`}>
          {searchNode.username}
        </Link>
        results = <ListItem
          leftAvatar={<Avatar size={32} src={searchNode.avatar_url} />}
          primaryText={title}
          innerDivStyle={{padding: '16px 64px 16px'}}
          onClick={() => this.props.goToPage(`/u/${searchNode.username}`)}
        />
      } else {
        const title = <Link to={`/bubbles/${searchNode.permalink}`} style={titleStyle}>
          {searchNode.name}
        </Link>
        results = <ListItem
          leftAvatar={<Avatar size={32} src={searchNode.avatar_url} />}
          primaryText={title}
          innerDivStyle={{padding: '16px 64px 16px'}}
          onClick={() => this.props.goToPage(`/bubbles/${searchNode.permalink}`)}
        />
      }
    } else {
      if (this.props.type === 'user') {
        const friendRequestSent = (searchNode.friendship_status === 'pending');
        results = (<div className="search-result-item">
          <div className="search-result-item-left">
            <Link to={`/u/${searchNode.username}`} className="user-avatar feed-user-avatar">
              <img src={searchNode.avatar_url} role="presentation" />
            </Link>
            <div className="search-result-item-content">
              <Link to={`/u/${searchNode.username}`} style={titleStyle}>
                {searchNode.username}
              </Link>
            </div>
          </div>
          <div>
            <Link to={`/u/${searchNode.username}`} style={titleStyle}>
              <FlatButton
                primary
                className="search-item-view"
                label="View"
                labelStyle={{ textTransform: 'capitalize' }}
                hoverColor="#eafbf1"
                style={searchButtonsStyle}
              />
            </Link>
            {
              searchNode.friendship_status === 'approved' ?
                <FlatButton
                  className="search-item-action"
                  label="- Remove"
                  labelStyle={{ textTransform: 'capitalize', color: '#FFFFFF' }}
                  style={{ ...searchButtonsStyle, backgroundColor: '#62db95' }}
                  onClick={() => this.props.removeFriend(searchNode.id, this.props.index)}
                />
              :
                <FlatButton
                  className="search-item-action"
                  label={friendRequestSent ? 'Pending' : 'Add'}
                  labelStyle={{ textTransform: 'capitalize', color: '#FFFFFF' }}
                  style={{
                    ...searchButtonsStyle,
                    backgroundColor: (friendRequestSent ? '#d6d8dc' : '#62db95'),
                    borderColor: (friendRequestSent ? '#d6d8dc' : '#62db95'),
                  }}
                  disabled={friendRequestSent}
                  onClick={() => this.props.addFriend(searchNode.id, this.props.index)}
                />
            }
          </div>
        </div>
      );
      } else {
        results = (<div className="search-result-item myb-message">
          <div className="search-result-item-left">
            <Link to={`/bubbles/${searchNode.permalink}`} className="user-avatar feed-user-avatar">
              <img src={searchNode.avatar_url} role="presentation" />
            </Link>
            <div className="search-result-item-content">
              <Link to={`/bubbles/${searchNode.permalink}`} style={titleStyle}>
                {searchNode.name}
              </Link>
              <div>
                {searchNode.description}
              </div>
              <div className="message-stats">
                <span className="stat">
                  <IconSocialPeople />
                  {searchNode.members_count}
                </span>
                <span className="stat">
                  <IconActionFavorite />
                  {searchNode.members_count}
                </span>
              </div>
            </div>
          </div>
          <div>
            <Link to={`/bubbles/${searchNode.permalink}`}>
              <FlatButton
                primary
                className="search-item-view"
                label="View"
                labelStyle={{ textTransform: 'capitalize' }}
                style={searchButtonsStyle}
              />
            </Link>
          </div>
        </div>
        );
      }
    }

    return results;
  }
}

SearchItem.propTypes = {
  node: React.PropTypes.object,
  type: React.PropTypes.string,
  index: React.PropTypes.number,
  removeFriend: React.PropTypes.func,
  addFriend: React.PropTypes.func,
};

export default SearchItem;
