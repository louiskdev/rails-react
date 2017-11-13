/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const getMyBubbles = gql`
  query getMyBubbles {
    interesting_bubbles(first: 10) {
      edges {
        cursor
        node {
          id
          name
          avatar_url(version: "micro")
          description
          members_count
          kind
          likes_count
          liked
          permalink
          total_unread_items_count
          user_role
          type
        }
      }
    }
  }
`;

export default (container) => (
  graphql(getMyBubbles)(container)
);
