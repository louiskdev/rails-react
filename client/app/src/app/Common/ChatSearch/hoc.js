/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getFriends = gql`
  query getFriends($keyword: String!) {
    currentUser {
      id
      friends(keyword: $keyword) {
        edges {
          node {
            id
            username
            avatar_url(version: "micro")
          }
        }
      }
    }
  }
`;

export default (container) => (
  graphql(getFriends, {
    options: (ownProps) => ({
      keyword: ownProps.keyword,
    }),
  })(withRouter(container))
);
