/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const sendMassEmail = gql`
  mutation sendMassEmail($subject: String!, $content: String!) {
    sendMassEmail(input: {subject: $subject, content: $content}) {
      status
    }
  }
`;

export default (container) => (
  graphql(sendMassEmail, {
    name: 'sendMassEmail',
  })(container)
);
