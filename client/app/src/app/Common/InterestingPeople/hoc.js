/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const mapQueriesToProps = () => ({
  data: {
    query: gql`
      query getInterestingPeople {
        interesting_users(first: 3) {
          edges {
            cursor
            node {
              id
          	  username
              avatar_url(version: "micro")
            }
          }
        }
      }
    `,
    variables: {

    },
    forceFetch: true,
  },
});

const mapMutationsToProps = () => ({

});

export default (container) => (
  compose(
    connect({
      mapQueriesToProps,
      mapMutationsToProps,
    }),
    withRouter
  )(container)
);
