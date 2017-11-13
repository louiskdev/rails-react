/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

const changePermission = gql`
  mutation adminChangePermission($username: String!, $admin: Int!) {
    changePermission(input: {username: $username, admin: $admin}) {
      status
    }
  }
`;

const disableBubbleWidget = gql`
  mutation disableWidgetMutation($bubble_id: Int!, $name: String!) {
    disableWidget(input: {bubble_id: $bubble_id, name: $name}) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(changePermission, {
      name: 'changePermission',
    }),
    graphql(disableBubbleWidget, {
      name: 'disableBubbleWidget',
    }),
  )(container)
);
