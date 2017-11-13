/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const countDownload = gql`
  mutation countDownload($file_id: Int!) {
    countDownload(input: { file_id: $file_id }) {
      status
    }
  }
`;

const deleteFile = gql`
  mutation deleteFile($file_id: Int!) {
    deleteFile(input: { file_id: $file_id }) {
      status
    }
  }
`;

const deleteDocument = gql`
  mutation deleteDocument($document_id: Int!) {
    deleteDocument(input: { document_id: $document_id }) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(countDownload, {
      name: 'countDownload',
    }),
    graphql(deleteFile, {
      name: 'deleteFile',
    }),
    graphql(deleteDocument, {
      name: 'deleteDocument',
    }),
  )(container)
);
