/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getMedium = gql`
  query getMedium($media_id: Int!) {
    medium(id: $media_id) {
      author {
        username
      }
      comments_count
      id
      liked
      likes_count
      picture_url
      recoding_job_id
      type
      user_id
      video_links
      visits_count
      comments {
        edges {
          cursor  #pagination field
          node {
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
            medium {
              type
              id
              picture_url(version: "lscape")
              thumb_url
              video_links
              recoding_job_id
            }
          }
        }
      }
    }
  }
`;

const shareMedium = gql`
  mutation shareMedia($id: Int!) {
    shareMedium(input: {id: $id }) {
      status
    }
  }
`;

const deleteMedium = gql`
  mutation deleteMedia($id: Int!) {
    destroyMedium(input: {id: $id }) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getMedium, {
      options: (ownProps) => ({
        variables: {
          media_id: parseInt(ownProps.media_id),
        },
        forceFetch: true,
      }),
    }),
    graphql(shareMedium, {
      name: 'shareMedium',
    }),
    graphql(deleteMedium, {
      name: 'deleteMedium',
    }),
  )(withRouter(container))
);
