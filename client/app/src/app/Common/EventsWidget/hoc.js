/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const getCurrentUser = gql`
  query getCurrentUser {
    currentUser {
      id
    }
  }
`;

const joinEvent = gql`
  mutation joinEvent($event_id: Int!) {
    joinEvent(input: { event_id: $event_id  }) {
      status
    }
  }
`;

const disjoinEvent = gql`
  mutation disjoinEvent($event_id: Int!) {
    disjoinEvent(input: { event_id: $event_id  }) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getCurrentUser, {
      options: {
        forceFetch: true,
        activeCache: false,
      },
    }),
    graphql(joinEvent, {
      name: 'joinEvent',
    }),
    graphql(disjoinEvent, {
      name: 'disjoinEvent',
    }),
  )(container)
);
