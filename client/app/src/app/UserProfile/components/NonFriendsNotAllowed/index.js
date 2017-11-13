/* @flow */

import React, { Component } from 'react';
import CommonStyles from '@utils/CommonStyles';
import FlatButton from 'material-ui/FlatButton';

class NonFriendsNotAllowed extends Component {

  render() {
    const { username } = this.props;
    return (
      <div style={CommonStyles.common.boxStyle}>
        <div>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 336 501.33334'
            version='1.1'
            style={CommonStyles.common.svgStyle}>
            <g transform='matrix(1.3333333,0,0,-1.3333333,0,501.33333)'>
              <g transform='scale(0.1)'>
                <path
                  style={{ fill: '#d9dadb', fillOpacity: 1, fillRule: 'nonzero', stroke: 'none' }}
                  d='M 680,2643.63 V 2940 c 0,319.8 260.199,580 580,580 319.8,0 580,-260.2 580,-580 v -296.37 c 1.33,-0.54 2.62,-1.05 3.95,-1.6 82.77,-35 161.56,-77.11 236.05,-125.78 V 2940 c 0,452.15 -367.85,820 -820,820 -452.148,0 -820,-367.85 -820,-820 v -423.75 c 74.488,48.67 153.281,90.78 236.051,125.78 1.328,0.55 2.621,1.06 3.949,1.6 z' />
                <path
                  style={{ fill: '#d9dadb', fillOpacity: 1, fillRule: 'nonzero', stroke: 'none' }}
                  d='M 1260,2520 C 564.102,2520 0,1955.9 0,1260 0,564.102 564.102,0 1260,0 c 695.9,0 1260,564.102 1260,1260 0,695.9 -564.1,1260 -1260,1260 z M 1380,1195.55 V 767.07 h -240 v 428.48 c -94.61,44.92 -160,141.33 -160,253 0,154.65 125.35,280 280,280 154.65,0 280,-125.35 280,-280 0,-111.67 -65.39,-208.08 -160,-253 z' />
              </g>
            </g>
          </svg>
        </div>
        <div style={CommonStyles.common.textStyle}>
          <div>This information is not public.</div>
          <br/>
          <FlatButton
            backgroundColor={this.props.isFriendRequestPending ? '#eee' : '#62db95'}
            hoverColor={this.props.isFriendRequestPending ? '#ddd' : '#308775'}
            label={this.props.isFriendRequestPending ? 'Request sent' : 'Add to friends'}
            labelStyle={{ color: this.props.isFriendRequestPending ? '#aaa' : '#ffffff', fontSize: 12 }}
            disabled={this.props.isFriendRequestPending}
            onClick={this.props.addFriend.bind(this, this.props.userId)}
            style={{ width: 140, marginLeft: 0 }} />
        </div>
      </div>
    );
  }
}

export default NonFriendsNotAllowed;
