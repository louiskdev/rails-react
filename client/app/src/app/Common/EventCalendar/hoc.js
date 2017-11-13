/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getMyEvents = gql`
  query getMyEvents($start_date: String, $end_date: String) {
    myEvents(start_date: $start_date, end_date: $end_date) {
      edges {
        node {
          id
          name
          permalink
          avatar_url(version: "micro")
          type
          likes_count
          members_count
          start_date
          address
          description
          members {
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
    }
    currentUser {
      id
    }
  }
`;

export default (container) => (
  graphql(getMyEvents, {
    options: (ownProps) => ({
      variables: {
        start_date: ownProps.startDate,
        end_date: ownProps.endDate,
      },
    }),
  })(withRouter(container))
);
