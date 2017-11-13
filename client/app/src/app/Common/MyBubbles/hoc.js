/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const getMyBubbles = gql`
  query getMyBubbles {
    my_bubbles(first: 50) {
      edges {
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

const disjoinBubble = gql`
  mutation disjoinMe($bubble_id: Int!) {
    disjoinMeFromBubble(input: {bubble_id: $bubble_id }) {
      bubble {
        name
      }
    }
  }
`;

const deleteBubble = gql`
  mutation destroyBubble($id: Int!) {
    destroyBubble(input: {id: $id}) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getMyBubbles),
    graphql(disjoinBubble, {
      name: 'disjoinBubble',
    }),
    graphql(deleteBubble, {
      name: 'deleteBubble',
    }),
  )(container)
);
