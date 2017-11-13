/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const getFriends = gql`
query getFriends {
  currentUser {
    id
    friends(sort_by: "last_message_date", all: true) {
      edges {
        node {
          id
          username
          first_name
          avatar_url(version: "micro")
        }
      }
    }
  }
}
`;

export default (container) => (
  graphql(getFriends)(container)
);
