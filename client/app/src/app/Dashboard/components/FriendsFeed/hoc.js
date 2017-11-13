/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import { feedItemResult } from '@utils/queryHelpers';
import gql from 'graphql-tag';

const getFriendsFeed = gql`
  query getFriendsFeed($privacy: String!, $sort_by: String!) {
    currentUser {
      id
    }
    hidden_posts_count(location: "friends_feed") {
      count
    }
    friends_feed(first: 10, privacy: $privacy, sort_by: $sort_by) {
      unread_activities_count
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
  mutation undoHiddenActivity {
    undoHiddenActivity(input: {location: "friends_feed"}) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getFriendsFeed, {
      options: (ownProps) => ({
        variables: {
          privacy: ownProps.privacy || '',
          sort_by: ownProps.sort_by || '',
        },
        forceFetch: true,
        activeCache: false,
      }),
    }),
    graphql(undoHiddenActivity, {
      name: 'undoHiddenActivity',
    }),
  )(withRouter(container))
);
