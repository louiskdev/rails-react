/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getMyBubbles = gql`
  query getMyBubbles($first: Int!, $keyword: String) {
    my_bubbles(first: $first, keyword: $keyword) {
      edges {
        node {
          id
          name
          total_unread_items_count
          avatar_url(version: "micro")
          permalink
          type
        }
      }
    }
  }
`;

export default (container) => (
  graphql(getMyBubbles, {
    name: 'getMyBubbles',
    options: (ownProps) => ({
      variables: {
        first: ownProps.allBubbles ? 100 : 10,
        keyword: ownProps.keyword || '',
      },
    }),
    forceFetch: true,
    activeCache: false,
  })(withRouter(container))
);
