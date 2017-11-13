/* @flow */

import React, { Component } from 'react';
import moment from 'moment';
import TimeAgo from 'react-timeago';

class BTimeAgo extends Component {

  render() {
    const createdAt = this.props.createdAt;
    const dateString = moment.utc(createdAt.replace(' UTC', '')).toDate();
    const timeAgo = moment().diff(dateString, 'days') < 1 ?
      <TimeAgo date={createdAt} />
      //moment(dateString).fromNow().replace('a few seconds ago', 'just now').replace('a day ago', 'yesterday')
      :
      moment(dateString).format('MMM Do, YYYY - hh:mm a');

    return (
      <span>
        {timeAgo}
      </span>
    );
  }
}

export default BTimeAgo;
