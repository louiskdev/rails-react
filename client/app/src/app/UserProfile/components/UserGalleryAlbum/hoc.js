/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getUserGalleryAllMedia = gql`
  query getUserGalleryAllMedia($album_id: Int!, $username: String!) {
    userGalleryAllMedia(album_id: $album_id, username: $username) {
      album {
        id
        name
      }
      bubble {
        id
        name
      }
      edges {
        node {
          id
          small_lscape_url: picture_url(version: "small_lscape") #250x180
          picture_url
          thumb_url
          type
          video_links
          recoding_job_id
          likes_count
          visits_count
        }
      }
    }
  }
`;

export default (container) => (
  graphql(getUserGalleryAllMedia, {
    options: (ownProps) => ({
      variables: {
        album_id: ownProps.album_id,
        username: ownProps.username,
      },
    }),
  })(withRouter(container))
);
