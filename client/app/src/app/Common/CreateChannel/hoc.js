/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const createChannel = gql`
  mutation createChannel(
    $chat_id: Int!,
    $name: String!,
    $type: String,
  ) {
    createChatChannel(input: {
      chat_id: $chat_id,
      name: $name,
      type: $type,
    }) {
      channel {
        id
        name
        kind
      }
    }
  }
`;

export default (container) => (
  compose(
    graphql(createChannel, {
      name: 'createChannel',
    }),
  )(withRouter(container))
);
