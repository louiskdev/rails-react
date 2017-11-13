/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const getMyNotifs = gql`
  query getMyNotifs {
    myNotifications(first: 10) {
      edges {
        cursor
        node {
          code
          created_at
          id
          activity_id
          comment_id
          medium_id
          object_type
          text
          unread
          new_member_token

          bubble {
            id
            name
            permalink
            type
          }
          initiator {
            id
            username
            avatar_url(version: "micro")
          }
          event {
            id
            name
          }
        }
      }
    }
  }
`;

export default (container) => (
  graphql(getMyNotifs)(container)
);
