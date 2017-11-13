/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getAlbumsFromGalleryWidget = gql`
  query getAlbumsFromGalleryWidget($bubble_id: Int!) {
    galleryWidgetAlbums(bubble_id: $bubble_id) {
      edges {
        node {
          avatar_url
          gallery_id
          id
          media_count
          name
          user_id
          likes_count
          visits_count
        }
      }
    }
  }
`;

export default (container) => (
  graphql(getAlbumsFromGalleryWidget)(withRouter(container))
);
