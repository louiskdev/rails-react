/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const getInterestingPeople = gql`
  query getInterestingPeople {
    interesting_users(first: 3) {
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
  graphql(getInterestingPeople)(container)
);
