/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import update from 'react-addons-update';
import { feedItemResult } from '@utils/queryHelpers';

const createNote = gql`
  mutation createNewNote(
    $private: Boolean!,
    $text: String!,
    $picture_files: [String],
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
  graphql(createNote, {
    name: 'createNote',
    props: ({ createNote }) => ({
      submit(vars) {
        return createNote({
          variables: vars.variables,
          updateQueries: {
            createNewNote: (prev, { mutationResult }) => {
              const newNote = mutationResult.createNote.activity ?
                { __typename: 'ActivityEdge', cursor: null, node: mutationResult.createNote.activity }
                :
                mutationResult.createNote.activity;
              const newNotes = update(prev, {
                createNote: {
                  edges: {
                    $push: [newNote],
                  },
                },
              });
              return newNotes;
            },
          },
        });
      },
    }),
  })(container)
);
