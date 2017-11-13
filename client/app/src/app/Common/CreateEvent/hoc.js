/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const createEvent = gql`
  mutation createNewEvent(
    $name: String!,
    $avatar: String,
    $avatar_filename: String,
    $type: String!,
    $start_date: String!,
    $address: String!,
    $description: String,
    $bubble_id: Int!
  ) {
    createEvent(input: {
      name: $name,
      avatar: $avatar,
      avatar_filename: $avatar_filename,
      type: $type,
      start_date: $start_date,
      address: $address,
      description: $description,
      bubble_id: $bubble_id
    }) {
      event {
        id
      }
    }
  }
`;

export default (container) => (
  graphql(createEvent, {
    name: 'createEvent',
  })(container)
);
