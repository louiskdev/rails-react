/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const checkToken = gql`
  query checkToken($token: String!) {
    checkConfirmationToken(token: $token)
  }
`;

export default (container) => (
  graphql(checkToken, {
    options: (ownProps) => ({
      variables: {
        token: ownProps.location.query.confirmation_token,
      },
    }),
  })(container)
);
