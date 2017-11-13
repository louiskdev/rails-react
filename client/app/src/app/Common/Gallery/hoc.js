/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getMyAlbums = gql`
  query getMyAlbums {
    myGalleryAlbums(first: 18) {
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
  graphql(getMyAlbums, {
    forceFetch: true,
    activeCache: false,
  })(withRouter(container))
);
