/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import update from 'react-addons-update';

const createComment = gql`
  mutation createComment(
    $object_type: String!,
    $object_id: Int!,
    $text: String!,
    $picture_files: [String]!,
    $video_id: Int!,
    $link_url: String!,
    $link_title: String!,
    $link_description: String!,
    $link_picture_url: String!,
    $parent_id: Int!,
    $location: String!,
  ) {
    createComment(input: {
      object_type: $object_type,
      object_id: $object_id,
      text: $text,
      picture_files: $picture_files,
      video_id: $video_id,
      link_url: $link_url,
      link_title: $link_title,
      link_description: $link_description,
      link_picture_url: $link_picture_url,
      parent_id: $parent_id,
      location: $location,
    }) {
      comment {
        author {
          id
          username
          avatar_url(version: "micro")
        }
        body
        commentable_id
        commentable_type
        created_at
        id
        liked
        likes_count
        subject
        text
        title
        user_id
        link_preview {
          description
          id
          picture_url
          title
          url
        }
        media {
          edges {
            node {
              id
              type
              thumb_url #250x250
              small_url: picture_url(version: "small_square") #180x180
              big_url: picture_url(version: "big_square") #500x500
              landscape_url: picture_url(version: "lscape") #500x250
              small_lscape_url: picture_url(version: "small_lscape") #250x180
              original_url: picture_url # max 1200x1200
            }
          }
        }
        medium {
          id
          picture_url
          thumb_url
          video_links
          recoding_job_id
        }
      }
    }
  }
`;

export default (container) => (
  graphql(createComment, {
    name: 'createComment',
    props: ({ createComment }) => ({
      submit(vars) {
        return createComment({
          variables: vars.variables,
          updateQueries: {
            getComments: (prev, { mutationResult }) => {
              const newComment = mutationResult.data.createComment.comment ?
                { __typename: 'CommentEdge', node: mutationResult.data.createComment.comment }
                :
                mutationResult.data.createComment.edges[0];
              const newComments = update(prev, {
                rootCommentsForObject: {
                  edges: {
                    $push: [newComment],
                  },
                },
              });
              return newComments;
            },
          },
        });
      },
    }),
  })(container)
);
