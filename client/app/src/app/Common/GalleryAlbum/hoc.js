/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const myGalleryAlbumMedia = gql`
  query myGalleryAlbumMedia($album_id: Int!) {
    myGalleryAllMedia(album_id: $album_id) {
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
  graphql(myGalleryAlbumMedia, {
    forceFetch: true,
    activeCache: false,
  })(withRouter(container))
);
