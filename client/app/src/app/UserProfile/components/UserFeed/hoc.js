/* @flow */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import { feedItemResult } from '@utils/queryHelpers';
import gql from 'graphql-tag';

const getUserFeed = gql`
  query getUserFeed($username: String!) {
    hidden_posts_count(location: "user_feed") {
      count
    }
    user_feed(first: 10, username: $username) {
      edges {
        cursor
        node {
          ${feedItemResult}
        }
      }
    }
  }
`;

const undoHiddenActivity = gql`
  mutation undoHiddenActivity($location: String!, $feed_user_id: Int) {
    undoHiddenActivity(input: {location: $location, feed_user_id: $feed_user_id}) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getUserFeed, {
      options: (ownProps) => ({
        variables: {
          username: ownProps.username,
        },
      }),
    }),
    graphql(undoHiddenActivity, {
      name: 'undoHiddenActivity',
    })
  )(withRouter(container))
);
