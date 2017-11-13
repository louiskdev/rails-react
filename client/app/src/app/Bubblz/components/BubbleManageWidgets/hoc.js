/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const disableBubbleWidget = gql`
  mutation disableWidgetMutation($bubble_id: Int!, $name: String!) {
    disableWidget(input: {bubble_id: $bubble_id, name: $name}) {
      status
    }
  }
`;

export default (container) => (
  graphql(disableBubbleWidget, {
    name: 'disableBubbleWidget',
  })(container)
);
