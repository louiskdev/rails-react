/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';
import { feedItemResult } from '@utils/queryHelpers';

const getActivity = gql`
  query getActivity($activity_id: Int!) {
    activity(id: $activity_id) {
      ${feedItemResult}
    }
  }
`;

export default (container) => (
  graphql(getActivity, {
    options: (ownProps) => ({
      variables: {
        activity_id: parseInt(ownProps.activity_id),
      },
    }),
  })(withRouter(container))
);
