/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const mapQueriesToProps = () => ({
  data: {
    query: gql`
      query getPopularInterests {
        popular_interests(first: 3) {
          edges {
            node {
              name
            }
          }
        }
      }
    `,
    variables: {

    },
    activeCache: true,
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
