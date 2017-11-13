/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const createDocument = gql`
  mutation createDocument($bubble_id: Int!, $title: String!, $document: String!) {
    createDocument(input: {bubble_id: $bubble_id, title: $title, document: $document}) {
      status
      document_id
    }
  }
`;

const updateDocument = gql`
  mutation updateDocument($document_id: Int!, $title: String!, $updateData: String!) {
    updateDocument(input: {document_id: $document_id, title: $title, updateData: $updateData}) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(createDocument, {
      name: 'createDocument',
    }),
    graphql(updateDocument, {
      name: 'updateDocument',
    }),
  )(withRouter(container))
);
