/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getBubble = gql`
  query getBubble($permalink: String!) {
    currentUser {
      id
    }
    bubble(permalink: $permalink) {
      id
      name
      permalink
      description
      kind
      zip_code
      avatar_url(version: "thumb")
      cover_image_url
      created_at
      updated_at
      user_role
      members_count
      interests_count
      interests {
        edges {
          node {
            name
          }
        }
      }
      liked
      likes_count
      blog_widget_id
      chat_widget_id
      gallery_widget_id
      events_widget_id
      files_widget_id
    }
  }
`;

const changeBubbleAvatar = gql`
  mutation changeAva(
    $bubble_id: Int!,
    $picture_file: String!,
    $filename: String!,
    $crop_x: Int!,
    $crop_y: Int!,
    $crop_h: Int!,
    $crop_w: Int!,
    $rotation_angle: Int!,
  ) {
    changeBubbleAvatar(input: {
      bubble_id: $bubble_id,
      picture_file: $picture_file,
      filename: $filename,
      crop_x: $crop_x,
      crop_y: $crop_y,
      crop_h: $crop_h,
      crop_w: $crop_w,
      rotation_angle: $rotation_angle
    }) {
      bubble {
        avatar_url(version: "micro")
      }
    }
  }
`;

const joinBubble = gql`
  mutation joinMe($bubble_id: Int!) {
    joinMeToBubble(input: {bubble_id: $bubble_id }) {
      bubble {
        name
      }
    }
  }
`;

const disjoinBubble = gql`
  mutation disjoinMe($bubble_id: Int!) {
    disjoinMeFromBubble(input: {bubble_id: $bubble_id }) {
      bubble {
        name
      }
    }
  }
`;

const acceptInvitation = gql`
  mutation acceptInv($token: String!) {
    acceptBubbleInvitation(input: {token: $token }) {
      status
    }
  }
`;

const deleteBubble = gql`
  mutation destroyBubble($id: Int!) {
    destroyBubble(input: {id: $id}) {
      status
    }
  }
`;

const changeBubbleCover = gql`
  mutation updateBubble(
    $id: Int!,
    $cover_image: String!
    $bubbleName: String!,
    $zip_code: String!,
    $description: String!,
    $interests: [String],
    $avatar: String!
  ) {
    updateBubble(input: {
      id: $id,
      cover_image: $cover_image
      name: $bubbleName,
      zip_code: $zip_code,
      description: $description,
      interests: $interests,
      avatar: $avatar
    })
    {
      bubble {
        id
        name
        permalink
        description
        kind
        zip_code
        avatar_url(version: "thumb")
        cover_image_url
        created_at
        updated_at
        user_role
        members_count
        interests_count
        interests {
          edges {
            node {
              name
            }
          }
        }
        liked
        likes_count
        blog_widget_id
        chat_widget_id
        gallery_widget_id
        events_widget_id
        files_widget_id
      }
    }
  }
`;

export default (container) => (
  compose(
    graphql(getBubble, {
      options: (ownProps) => ({
        variables: {
          permalink: ownProps.params.permalink,
        },
        forceFetch: true,
      }),
    }),
    graphql(changeBubbleAvatar, {
      name: 'changeBubbleAvatar',
    }),
    graphql(joinBubble, {
      name: 'joinBubble',
    }),
    graphql(disjoinBubble, {
      name: 'disjoinBubble',
    }),
    graphql(acceptInvitation, {
      name: 'acceptInvitation',
    }),
    graphql(deleteBubble, {
      name: 'deleteBubble',
    }),
    graphql(changeBubbleCover, {
      name: 'changeBubbleCover',
    })
  )(withRouter(container))
);
