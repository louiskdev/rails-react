/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const getFriends = gql`
  query getFriends {
    currentUser {
      id
      friends(sort_by: "last_message_date", all: true) {
        edges {
          node {
            id
            username
            avatar_url(version: "micro")
            wheel_chat_missed_messages_count
          }
        }
      }
    }
  }
`;

const reportOnlineTime = gql`
  mutation reportOnlineTime($session_time: Int!) {
    reportOnlineTime(input: { session_time: $session_time }) {
      status
    }
  }
`;

const clearUnreadCount = gql`
  mutation clearWheelchatMissedMessages($channelName: String!) {
    clearWheelChatNotifications(input: {channel_name: $channelName }) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getFriends),
    graphql(reportOnlineTime, {
      name: 'reportOnlineTime',
    }),
    graphql(clearUnreadCount, {
      name: 'clearUnreadCount',
    }),
  )(container)
);
