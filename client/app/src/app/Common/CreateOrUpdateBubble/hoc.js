/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const createNewBubble = gql`
  mutation createNewBubble(
    $bubbleType: String!,
    $bubbleName: String!,
    $zip_code: String!,
    $description: String!,
    $widgets: [String],
    $interests: [String],
    $avatar_filename: String!,
    $avatar: String!
  ) {
    createBubble(input: {
      type: $bubbleType,
      name: $bubbleName,
      zip_code: $zip_code,
      description: $description,
      widgets: $widgets,
      interests: $interests,
      avatar_filename: $avatar_filename,
      avatar: $avatar
    })
    {
      bubble {
        id
        name
        avatar_url(version: "micro")
        permalink
      }
    }
  }`;

const updateBubble = gql`
  mutation updateBubble(
    $id: Int!,
    $bubbleName: String!,
    $zip_code: String!,
    $description: String!,
    $interests: [String],
    $avatar_filename: String!,
    $avatar: String!
  ) {
    updateBubble(input: {
      id: $id,
      name: $bubbleName,
      zip_code: $zip_code,
      description: $description,
      interests: $interests,
      avatar_filename: $avatar_filename,
      avatar: $avatar
    })
    {
      bubble {
        id
        name
        avatar_url(version: "thumb")
        permalink
      }
    }
  }
`;

export default (container) => (
  compose(
    graphql(createNewBubble, {
      name: 'createNewBubble',
    }),
    graphql(updateBubble, {
      name: 'updateBubble',
    })
  )(container)
);
