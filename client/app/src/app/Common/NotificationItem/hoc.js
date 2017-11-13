/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const readNotification = gql`
  mutation readNotif($id: Int!) {
    touchNotification(input: {id: $id }) {
      status
    }
  }
`;

const destroyNotification = gql`
  mutation rmNotif($id: Int!) {
    destroyNotification(input: {id: $id }) {
      status
    }
  }
`;

const acceptFriendship = gql`
  mutation approveFriendship($id: Int!, $friend_id: Int!) {
    approveFriendship(input: {notification_id: $id, friend_id: $friend_id }) {
      status
    }
  }
`;

const declineFriendship = gql`
  mutation declineFriendship($id: Int!, $friend_id: Int!) {
    declineFriendship(input: {notification_id: $id, friend_id: $friend_id }) {
      status
    }
  }
`;

const acceptInvitation = gql`
  mutation acceptInv($token: String!) {
    acceptBubbleInvitation(input: {token: $token }) {
      status
    }
  }
`;

const declineInvitation = gql`
  mutation declineInv($token: String!) {
    cancelBubbleInvitation(input: {token: $token }) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(readNotification, {
      name: 'readNotification',
    }),
    graphql(destroyNotification, {
      name: 'destroyNotification',
    }),
    graphql(acceptFriendship, {
      name: 'acceptFriendship',
    }),
    graphql(declineFriendship, {
      name: 'declineFriendship',
    }),
    graphql(acceptInvitation, {
      name: 'acceptInvitation',
    }),
    graphql(declineInvitation, {
      name: 'declineInvitation',
    }),
  )(withRouter(container))
);
