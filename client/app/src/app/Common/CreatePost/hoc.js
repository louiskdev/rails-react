/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import update from 'react-addons-update';
import { feedItemResult } from '@utils/queryHelpers';

const createPost = gql`
  mutation createNewPost(
    $blog_id: Int!,
    $title: String!,
    $text: String!,
    $picture_files: [String]!,
    $link_url: String!,
    $link_title: String!,
    $link_description: String!,
    $link_picture_url: String!,
  ) {
    createBlogPost(input: {
      blog_id: $blog_id,
      title: $title,
      text: $text,
      picture_files: $picture_files,
      link_url: $link_url,
      link_title: $link_title,
      link_description: $link_description,
      link_picture_url: $link_picture_url,
    }) {
      activity {
        ${feedItemResult}
      }
    }
  }
`;

export default (container) => (
  graphql(createPost, {
    name: 'createPost',
    props: ({ createPost }) => ({
      submit(vars) {
        return createPost({
          variables: vars.variables,
          updateQueries: {
            createNewNote: (prev, { mutationResult }) => {
              const newPost = mutationResult.createBlogPost.activity ?
                { __typename: 'ActivityEdge', cursor: null, node: mutationResult.createBlogPost.activity }
                :
                mutationResult.createBlogPost.activity;
              const newPosts = update(prev, {
                createBlogPost: {
                  edges: {
                    $push: [newPost],
                  },
                },
              });
              return newPosts;
            },
          },
        });
      },
    }),
  })(container)
);
