/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const rateObject = gql`
  mutation rateObject(
    $object_type: String!,
    $object_id: Int!,
    $rating: Int!,
  ) {
    rateObject(input: {
      object_type: $object_type,
      object_id: $object_id,
      rating: $rating,
    }) {
      object {
        rating
        raters_count
        user_rating
      }
    }
  }
`;

const updateNote = gql`
  mutation updateNote(
    $id: Int!,
    $text: String!,
    $link_url: String!,
    $link_title: String!,
    $link_description: String!,
    $link_picture_url: String!
  ) {
    updateNote(input: {
      id: $id,
      text: $text,
      link_url: $link_url,
      link_title: $link_title,
      link_description: $link_description,
      link_picture_url: $link_picture_url
    }) {
      note {
        # some Note fields
        text
        updated_at
      }
    }
  }
`;

const updatePost = gql`
  mutation updatePost(
    $id: Int!,
    $title: String!,
    $text: String!,
    $link_url: String!,
    $link_title: String!,
    $link_description: String!,
    $link_picture_url: String!,
  ) {
    updateBlogPost(input: {
      id: $id,
      title: $title,
      text: $text,
      link_url: $link_url,
      link_title: $link_title,
      link_description: $link_description,
      link_picture_url: $link_picture_url,
    }) {
      activity {
        o_post {
          # some Post fields
          text
          updated_at
        }
      }
    }
  }
`;

const shareActivity = gql`
  mutation shareActivity($id: Int!) {
    shareActivity(input: {id: $id }) {
      status
    }
  }
`;

const hideActivity = gql`
  mutation hideActivity(
    $id: Int!,
    $location: String!,
    $feed_user_id: Int!
  ) {
    hideActivity(input: {
      id: $id,
      location: $location,
      feed_user_id: $feed_user_id
    }) {
      status
    }
  }
`;

const deleteNote = gql`
  mutation deleteNote($id: Int!) {
    destroyNote(input: {id: $id }) {
      status
    }
  }
`;

const deletePost = gql`
  mutation destroyPost($id: Int!) {
    destroyBlogPost(input: {id: $id }) {
      status
    }
  }
`;

const deleteSharedPost = gql`
  mutation destroySharedActivity($id: Int!) {
    destroySharedActivity(input: {id: $id}) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(rateObject, {
      name: 'rateObject',
    }),
    graphql(updateNote, {
      name: 'updateNote',
    }),
    graphql(updatePost, {
      name: 'updatePost',
    }),
    graphql(shareActivity, {
      name: 'shareActivity',
    }),
    graphql(hideActivity, {
      name: 'hideActivity',
    }),
    graphql(deleteNote, {
      name: 'deleteNote',
    }),
    graphql(deletePost, {
      name: 'deletePost',
    }),
    graphql(deleteSharedPost, {
      name: 'deleteSharedPost',
    }),
  )(container)
);
