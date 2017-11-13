/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getCurrentUserInfo = gql`
  query getCurrentUserInfo {
    currentUser {
      id
      username
      email
      gender
      interests {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`;

const changeInterests = gql`
  mutation changeUserInterests($interests: [String]!) {
    changeUserInterests(input: {interests: $interests }) {
      user {
        id
      }
    }
  }
`;

export default (container) => (
  compose(
    graphql(getCurrentUserInfo, {
      name: 'getCurrentUserInfo',
      options: (ownProps) => ({
        variables: {
          channelName: ownProps.channelName,
        },
      }),
    }),
    graphql(changeInterests, {
      name: 'changeInterests',
    }),
  )(withRouter(container))
);
