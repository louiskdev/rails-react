/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import { feedItemResult } from '@utils/queryHelpers';
import gql from 'graphql-tag';

const getHashtagFeed = gql`
  query getHashtagFeed($hashtag: String!) {
    currentUser {
      id
    }
    hidden_posts_count(location: "hashtag_feed") {
      count
    }
    hashtag_feed(first: 10, hashtag: $hashtag) {
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
    undoHiddenActivity(input: {location: "hashtag_feed"}) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getHashtagFeed, {
      options: (ownProps) => ({
        variables: {
          hashtag: ownProps.hashtag,
        },
      }),
    }),
    graphql(undoHiddenActivity),
  )(withRouter(container))
);
