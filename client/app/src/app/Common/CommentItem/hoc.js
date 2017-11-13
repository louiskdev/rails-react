/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const updateComment = gql`
  mutation updateComment(
    $id: Int!,
    $text: String!,
    $link_url: String!,
    $link_title: String!,
    $link_description: String!,
    $link_picture_url: String!
  ) {
    updateComment(input: {
      id: $id,
      text: $text,
      link_url: $link_url,
      link_title: $link_title,
      link_description: $link_description,
      link_picture_url: $link_picture_url
    }) {
      comment {
        # some Comment fields
        id
      }
    }
  }
`;

const deleteComment = gql`
  mutation deleteComment($id: Int!) {
    destroyComment(input: {id: $id }) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(updateComment, {
      name: 'updateComment',
    }),
    graphql(deleteComment, {
      name: 'deleteComment',
    }),
  )(container)
);
