/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getAllMedia = gql`
  query getAllMedia {
    myGalleryAllMedia(first: 20) {
      edges {
        node {
          id
          small_lscape_url: picture_url(version: "small_lscape") #250x180
          picture_url
          thumb_url
          type
          video_links
          likes_count
          visits_count
        }
      }
    }
  }
`;

export default (container) => (
  graphql(getAllMedia, {
    forceFetch: true,
    activeCache: false,
  })(withRouter(container))
);
