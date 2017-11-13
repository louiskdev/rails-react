/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Link } from 'react-router';
import CommonStyles from '@utils/CommonStyles';

import IconSocialPeople from 'material-ui/svg-icons/social/people';
import IconEditorBubbleChart from 'material-ui/svg-icons/editor/bubble-chart';
import IconActionDelete from 'material-ui/svg-icons/action/delete';
import IconActionSettings from 'material-ui/svg-icons/action/settings';

class BubbleManageTopBar extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
  }

  render() {

    return (
      <div className="bubble-manage-menu" style={CommonStyles.bubbleManage.topbarStyle}>
        <Link
          className={this.props.currentUrl === 'bubble-manage-users' ? 'active' : ''}
          to={`/bubbles/${this.props.permalink}/manage-users`}
          >
          <IconSocialPeople style={CommonStyles.iconStyle} />
          Manage users
        </Link>
        <Link
          className={this.props.currentUrl === 'bubble-manage-bubble' ? 'active' : ''}
          to={`/bubbles/${this.props.permalink}/manage-info`}
        >
          <IconEditorBubbleChart style={CommonStyles.iconStyle} />
          Manage bubble info
        </Link>
        <Link
          className={this.props.currentUrl === 'bubble-manage-widgets' ? 'active' : ''}
          to={`/bubbles/${this.props.permalink}/manage-widgets`}
        >
          <IconActionSettings style={CommonStyles.iconStyle} />
          Manage widgets
        </Link>
        <Link
          to={`/bubbles/${this.props.permalink}`}
          onClick={this.props.openDeleteDialog}
          style={{color: '#d97575', float: 'right'}}
        >
          <IconActionDelete style={{...CommonStyles.iconStyle, color: '#d97575'}} />
          Delete bubble
        </Link>
      </div>
    );
  }
}

export default BubbleManageTopBar;
