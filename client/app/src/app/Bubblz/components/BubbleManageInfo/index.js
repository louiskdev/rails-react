/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import CreateOrUpdateBubble from '@common/CreateOrUpdateBubble';
import BubbleManageTopBar from '../BubbleManageTopBar';
import CommonStyles from '@utils/CommonStyles';

class BubbleManageInfo extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
  }

  render() {

    return (
      <div style={CommonStyles.bubbleManage.containerStyle}>
        <div style={CommonStyles.bubbleManage.topbarStyle}>
          <BubbleManageTopBar openDeleteDialog={this.props.openDeleteDialog} permalink={this.props.bubble.permalink} currentUrl='bubble-manage-bubble' />
        </div>
        <CreateOrUpdateBubble
          refetchBubbles={() => false}
          bubble={this.props.bubble}
          update />
      </div>
    );
  }
}

export default BubbleManageInfo;
