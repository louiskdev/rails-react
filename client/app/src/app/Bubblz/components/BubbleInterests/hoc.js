/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const changeInterests = gql`
  mutation changeInterests($bubble_id: Int!, $interests: [String]!) {
    changeBubbleInterests(input: { bubble_id: $bubble_id, interests: $interests }) {
      bubble {
        id
        name
        interests {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  }
`;

export default (container) => (
  graphql(changeInterests, {
    name: 'changeInterests',
  })(container)
);
