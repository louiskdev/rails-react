/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getUserGalleryAlbums = gql`
  query getUserGalleryAlbums($username: String!) {
    userGalleryAlbums(username: $username) {
      edges {
        node {
          avatar_url
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
  graphql(getUserGalleryAlbums)(withRouter(container))
);
