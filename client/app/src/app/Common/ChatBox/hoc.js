/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getWheelchat = gql`
  query getWheelchat($channelName: String!) {
    wheelchat(channel_name: $channelName) {
      channel_name
      members {
        username
      }
      history(first: 30, order_by: "date", reverse_order: true) {
        edges {
          cursor
          node {
            id
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
              picture_url(version: "lscape")
              video_links
              recoding_job_id
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
`;

const sendMessage = gql`
  mutation create_1v1_message(
    $channel_name: String!,
    $text: String!,
    $picture_file: String!,
    $picture_filename: String!,
    $link_url: String!,
    $link_title: String!,
    $link_description: String!,
    $link_picture_url: String!,
    $private: Boolean!,
    $video_id: Int!
  ) {
    createWheelChatMessage(input: {
      channel_name: $channel_name,
      text: $text,
      picture_file: $picture_file,
      picture_filename: $picture_filename,
      link_url: $link_url,
      link_title: $link_title,
      link_description: $link_description,
      link_picture_url: $link_picture_url,
      private: $private,
      video_id: $video_id
    }) {
      message {
        id
        text
        created_at
        author {
          id
          username
          avatar_url(version: "thumb")
        }
        medium {
          id
          type
          thumb_url
          picture_url
          video_links
          recoding_job_id
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
`;

export default (container) => (
  compose(
    graphql(getWheelchat, {
      options: (ownProps) => ({
        variables: {
          channelName: ownProps.channelName,
        },
        forceFetch: true,
      }),
    }),
    graphql(sendMessage, {
      name: 'sendMessage',
    }),
  )(withRouter(container))
);
