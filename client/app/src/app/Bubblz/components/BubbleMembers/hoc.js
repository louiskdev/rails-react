/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getBubbleMembers = gql`
  query getBubbleMembers($bubble_id: Int!) {
    bubbleMembers(bubble_id: $bubble_id, first: 3) {
      edges {
        cursor
        node {
          id
          username
          avatar_url(version: "micro")
        }
      }
    }
  }
`;

export default (container) => (
  graphql(getBubbleMembers, {
    options: (ownProps) => ({
      variables: {
        bubble_id: parseInt(ownProps.bubble.id),
      },
    }),
  })(withRouter(container))
);
