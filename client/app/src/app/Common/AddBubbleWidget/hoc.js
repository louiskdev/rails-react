/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const addBubbleWidget = gql`
  mutation addWidgetMutation($bubble_id: Int!, $name: String!) {
    addWidget(input: {bubble_id: $bubble_id, name: $name}) {
      status
    }
  }
`;

export default (container) => (
  graphql(addBubbleWidget, {
    name: 'addBubbleWidget',
  })(container)
);
