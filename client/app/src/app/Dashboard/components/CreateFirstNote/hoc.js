/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { feedItemResult } from '@utils/queryHelpers';

const createFirstNote = gql`
  mutation createNewNote(
    $private: Boolean!,
    $text: String!,
    $picture_files: [String]!,
    $video_id: Int!,
    $link_url: String!,
    $link_title: String!,
    $link_description: String!,
    $link_picture_url: String!,
  ) {
    createNote(input: {
      private: $private,
      text: $text,
      picture_files: $picture_files,
      video_id: $video_id,
      link_url: $link_url,
      link_title: $link_title,
      link_description: $link_description,
      link_picture_url: $link_picture_url,
    }) {
      activity {
        ${feedItemResult}
      }
    }
  }
`;

export default (container) => (
  graphql(createFirstNote, {
    name: 'createFirstNote',
  })(container)
);
