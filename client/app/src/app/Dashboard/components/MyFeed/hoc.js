/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import { feedItemResult } from '@utils/queryHelpers';
import gql from 'graphql-tag';

const getMyFeed = gql`
  query getMyFeed($privacy: String!, $sort_by: String!) {
    hidden_posts_count(location: "my_feed") {
      count
    }
    my_feed(first: 10, privacy: $privacy, sort_by: $sort_by) {
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
    undoHiddenActivity(input: {location: "my_feed"}) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getMyFeed, {
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
