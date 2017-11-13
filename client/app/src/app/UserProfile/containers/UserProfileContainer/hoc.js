/* @flow */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getAnotherUserInfo = gql`
  query getAnotherUserInfo($username: String!) {
    user(username: $username) {
      id
      username
      first_name
      avatar_url(version: "thumb")
      cover_image_url
      description
      gender
      zip_code
      birthday
      friends_count
      friendship_status
      friends(sort_by: "last_message_date", all: true) {
        edges {
          node {
            id
            username
            first_name
            avatar_url(version: "micro")
          }
        }
      }
      interests {
        edges {
          node {
            name
            id
          }
        }
      }
      bubbles {
        edges {
          node {
            id
            name
            avatar_url(version: "micro")
            description
            members_count
            likes_count
            liked
            permalink
            type
          }
        }
      }
    }
    currentUser {
      id
    }
  }
`;

const getUserMedia = gql`
  query getUserMedia($username: String!) {
    userGalleryAllMedia(username: $username, first: 6) {
      edges {
        node {
          id
          small_url: picture_url(version: "small_square")
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
  compose(
    graphql(getAnotherUserInfo, {
      name: 'getAnotherUserInfo',
      options: (ownProps) => ({
        variables: {
          username: ownProps.params.username,
        },
        forceFetch: true,
        activeCache: false,
      }),
    }),
    graphql(getUserMedia, {
      name: 'getUserMedia',
      options: (ownProps) => ({
        variables: {
          username: ownProps.params.username,
        },
      }),
    })
  )(withRouter(container))
);
