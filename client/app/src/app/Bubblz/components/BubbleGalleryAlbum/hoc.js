/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getAlbumMedia = gql`
  query getAlbumMedia($album_id: Int!, $gallery_id: Int!) {
    mediaFromGallery(album_id: $album_id, gallery_id: $gallery_id ) {
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
  graphql(getAlbumMedia, {
    options: (ownProps) => ({
      variables: {
        album_id: ownProps.album_id,
        gallery_id: ownProps.gallery_id,
      },
      forceFetch: true,
      activeCache: false,
    }),
  })(withRouter(container))
);
