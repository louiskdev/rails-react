/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getChatWidgetData = gql`
  query getChatWidgetData($id: ID!, $bubble_id: Int!) {
    bubbleMembers(bubble_id: $bubble_id) {
      edges {
        cursor
        node {
          id
          username
          avatar_url(version: "micro")
        }
      }
    }
    chat_widget(id: $id) {
      id
      online_members {
        edges {
          node {
            username
          }
        }
      }
      channels {
        edges {
          node {
            id
            name
            kind
            members {
              edges {
                node {
                  id
                  username
                }
              }
            }
          }
        }
      }
      private_channels {
        edges {
          node {
            id
            name
            kind
            members {
              edges {
                node {
                  id
                  username
                }
              }
            }
          }
        }
      }
    }
  }
`;

const sendMessage = gql`
  mutation createChatMessage(
    $chat_id: Int!,
    $channel_id: Int!,
    $text: String!,
    $picture_file: String!,
    $picture_filename: String!,
    $video_id: Int!,
    $link_url: String!,
    $link_title: String!,
    $link_description: String!,
    $link_picture_url: String!,
    $private: Boolean!,
  ) {
    createChatMessage(input: {
      chat_id: $chat_id,
      channel_id: $channel_id,
      text: $text,
      picture_file: $picture_file,
      picture_filename: $picture_filename,
      video_id: $video_id,
      link_url: $link_url,
      link_title: $link_title,
      link_description: $link_description,
      link_picture_url: $link_picture_url,
      private: $private,
    }) {
      message {
        text
        created_at
        author {
          id
          username
          avatar_url(version: "micro")
        }
      }
    }
  }
`;

const createChannel = gql`
  mutation createChannel(
    $chat_id: Int!,
    $name: String!,
    $type: String,
    $user_id: Int,
  ) {
    createChatChannel(input: {
      chat_id: $chat_id,
      name: $name,
      type: $type,
      user_id: $user_id,
    }) {
      channel {
        id
        name
        kind
      }
    }
  }
`;

const renameChannel = gql`
  mutation renameChatChannel(
    $channel_id: Int!,
    $new_name: String!,
  ) {
    renameChatChannel(input: {
      channel_id: $channel_id,
      new_name: $new_name,
    }) {
      status
    }
  }
`;

const removeChannel = gql`
  mutation removeChatChannel(
    $channel_id: Int!
  ) {
    removeChatChannel(input: {
      channel_id: $channel_id,
    }) {
      status
    }
  }
`;

const addUserToPrivateChannel = gql`
  mutation addUserToPrivateChannel(
    $channel_id: Int!,
    $user_id: Int!,
  ) {
    addUserToPrivateChannel(input: {
      channel_id: $channel_id,
      user_id: $user_id,
    }) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getChatWidgetData, {
      options: (ownProps) => ({
        variables: {
          id: ownProps.chatWidgetId,
          bubble_id: parseInt(ownProps.bubble.id),
        },
        forceFetch: true,
        activeCache: false,
      }),
    }),
    graphql(sendMessage, {
      name: 'sendMessage',
    }),
    graphql(createChannel, {
      name: 'createChannel',
    }),
    graphql(renameChannel, {
      name: 'renameChannel',
    }),
    graphql(removeChannel, {
      name: 'removeChannel',
    }),
    graphql(addUserToPrivateChannel, {
      name: 'addUserToPrivateChannel',
    }),
  )(withRouter(container))
);
