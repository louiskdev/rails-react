/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const getFriends = gql`
  query getFriends {
    currentUser {
      id
      username
      avatar_url(version: "micro")
      friends(sort_by: "last_message_date", all: true) {
        edges {
          node {
            id
            username
            first_name
            avatar_url(version: "micro")
            wheel_chat_missed_messages_count
          }
        }
      }
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
    graphql(getFriends, {
      forceFetch: true,
      activeCache: false,
    }),
    graphql(clearUnreadCount, {
      name: 'clearUnreadCount',
    }),
  )(container)
);
