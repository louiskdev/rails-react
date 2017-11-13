/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const getFriends = gql`
  query getFriends {
    currentUser {
      id
      friends {
        edges {
          node {
            id
            username
            avatar_url(version: "micro")
          }
        }
      }
    }
  }
`;

const requestDirectCall = gql`
  mutation initiateCall(
    $receiver_id: Int!,
    $video_call: Boolean!,
  ) {
    initiateCall(input: {
      receiver_id: $receiver_id,
      video_call: $video_call
    }) {
      status
      session_id
      token
    }
  }
`;

const rejectCall = gql`
  mutation rejectCall(
    $session_id: String!,
    $caller_id: Int!,
  ) {
    rejectCall(input: {
      session_id: $session_id,
      caller_id: $caller_id
    }) {
      status
    }
  }
`;

const inviteFriendToCall = gql`
  mutation inviteIntoCall(
    $receiver_id: Int!,
    $session_id: String!,
    $video_call: Boolean!,
  ) {
    inviteIntoCall(input: {
      receiver_id: $receiver_id,
      session_id: $session_id,
      video_call: $video_call
    }) {
      status
    }
  }
`;

const requestGroupCall = gql`
  mutation initiateGroupCall(
    $channel_id: Int!,
    $video_call: Boolean!,
  ) {
    initiateGroupCall(input: {
      channel_id: $channel_id,
      video_call: $video_call
    }) {
      status
      session_id
      token
    }
  }
`;

export default (container) => (
  compose(
    graphql(getFriends),
    graphql(requestDirectCall, {
      name: 'requestDirectCall',
    }),
    graphql(rejectCall, {
      name: 'rejectCall',
    }),
    graphql(inviteFriendToCall, {
      name: 'inviteFriendToCall',
    }),
    graphql(requestGroupCall, {
      name: 'requestGroupCall',
    }),
  )(container)
);
