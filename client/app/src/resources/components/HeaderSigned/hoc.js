/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getMyNotifs = gql`
query getMyNotifs($first: Int!) {
  myNotifications(first: $first) {
    unread_notifications_count
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
  myActionNotifications(first: $first) {
    unread_notifications_count
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
  graphql(getMyNotifs, {
    options: (ownProps) => ({
      variables: {
        first: ownProps.first ? ownProps.first : 5,
      },
    }),
  })(withRouter(container))
);
