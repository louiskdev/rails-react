/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const getAllMedia = gql`
  query getAllMedia {
    myGalleryAllMedia(first: 6) {
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

const getMyBubbles = gql`
  query getMyBubbles {
    my_bubbles(first: 14) {
      edges {
        node {
          id
          name
          description
          total_unread_items_count
          avatar_url(version: "micro")
          permalink
          type
        }
      }
    }
  }
`;

const getMyFriends = gql`
  query getFriends {
    currentUser {
      id
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
      birthday_friends(first: 5) {
        edges {
          node {
            id
            username
            first_name
            avatar_url(version: "micro")
          }
        }
      }
    }
  }
`;

const getTrendingHashtags = gql`
  query getTrendingHashtags {
    trendingHashtags(first: 5) {
      edges {
        node {
          name
          posts_count
        }
      }
    }
  }
`;

const changeUserAvatar = gql`
  mutation changeMyAvatar(
    $picture_file: String!,
    $filename: String!,
    $crop_x: Int!,
    $crop_y: Int!,
    $crop_h: Int!,
    $crop_w: Int!,
    $rotation_angle: Int!,
  ) {
    changeUserAvatar(input: {
      picture_file: $picture_file,
      filename: $filename,
      crop_x: $crop_x,
      crop_y: $crop_y,
      crop_h: $crop_h,
      crop_w: $crop_w,
      rotation_angle: $rotation_angle
    }) {
      user {
        avatar_url(version: "thumb")
      }
    }
  }
`;
const changeUserData = gql`
  mutation updateUser(
    $username: String,
    $first_name: String,
    $gender: String,
    $language: String,
    $birthday: String,
    $zip_code: String,
    $phone: String,
    $description: String,
    $avatar_filename: String,
    $avatar: String,
    $interests: [String],
    $cover_image: String,
  ) {
    updateUser(input: {
      username: $username,
      first_name: $first_name,
      gender: $gender,
      language: $language,
      birthday: $birthday,
      zip_code: $zip_code,
      phone: $phone,
      description: $description,
      avatar_filename: $avatar_filename,
      avatar: $avatar,
      interests: $interests,
      cover_image: $cover_image,
  })
    {
      user {
        id
        cover_image_url
        description
        zip_code
      }
    }
  }
`;

export default (container) => (
  compose(
    graphql(getAllMedia),
    graphql(getMyBubbles, {
      name: 'getMyBubbles',
      forceFetch: true,
      activeCache: false,
    }),
    graphql(getMyFriends, {
      name: 'getMyFriends',
      forceFetch: true,
      activeCache: false,
    }),
    graphql(getTrendingHashtags, {
      name: 'getTrendingHashtags',
      forceFetch: true,
      activeCache: false,
    }),
    graphql(changeUserAvatar, {
      name: 'changeUserAvatar',
    }),
    graphql(changeUserData, {
      name: 'changeUserData',
    }),
  )(container)
);
