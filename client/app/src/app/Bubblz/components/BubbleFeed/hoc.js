/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';
import { feedItemResult } from '@utils/queryHelpers';

const getBubbleFeed = gql`
  query getBubbleFeed($permalink: String!) {
    hidden_posts_count(location: "bubble_feed") {
      count
    }
    bubble_feed(permalink: $permalink, first: 10) {
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
  mutation undoHiddenActivity($location: String!, $bubble_permalink: String) {
    undoHiddenActivity(input: {location: $location, bubble_permalink: $bubble_permalink}) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getBubbleFeed, {
      options: (ownProps) => ({
        variables: {
          permalink: ownProps.bubbleName,
        },
        forceFetch: true,
        activeCache: false,
      }),
    }),
    graphql(undoHiddenActivity, {
      name: 'undoHiddenActivity',
      options: (ownProps) => ({
        variables: {
          location: 'bubble_feed',
          bubble_permalink: ownProps.bubbleName,
        },
      }),
    })
  )(withRouter(container))
);
