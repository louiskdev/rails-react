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
            avatar_url(version: "micro")
            wheel_chat_missed_messages_count
            wheel_chat_last_message {
              text
              created_at
              video_url
              author {
                id
                username
                avatar_url(version: "micro")
              }
              medium {
                id
                type
                thumb_url
                picture_url
                video_links
              }
              link_preview {
                description
                id
                picture_url
                title
                url
              }
            }
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
    graphql(getFriends),
    graphql(clearUnreadCount, {
      name: 'clearUnreadCount',
    }),
  )(container)
);
