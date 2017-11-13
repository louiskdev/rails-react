/* @flow */
/* eslint-disable max-len */

import { graphql, compose } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';

const getBubbleUsers = gql`
  query getBubbleUsers($permalink: String!) {
    bubble(permalink: $permalink) {
      id
      members {
        edges {
          node {
            id
            username
            avatar_url(version: "micro")
            description
            user_role_in_bubble
            zip_code
            birthday
            first_name
          }
        }
      }
      banned_users {
        edges {
          node {
            id
            username
            avatar_url(version: "micro")
            description
            user_role_in_bubble
            zip_code
            birthday
            first_name
          }
        }
      }
    }
  }
`;

const removeMember = gql`
  mutation removeMember($bubble_id: Int!, $member_id: Int!) {
    kickMemberFromBubble(input: { bubble_id: $bubble_id, member_id: $member_id }) {
      status
    }
  }
`;

const makeAdmin = gql`
  mutation abc($bubble_id: Int!, $member_id: Int!) {
    changeMemberRoleInBubble(input: { bubble_id: $bubble_id, member_id: $member_id, new_role: "moderator" }) {
      status
    }
  }
`;

const banMember = gql`
  mutation banMemberFromBubbleMutation($bubble_id: Int!, $member_id: Int!) {
    banMemberFromBubble(input: { bubble_id: $bubble_id, member_id: $member_id }) {
      status
    }
  }
`;

const unbanMember = gql`
  mutation unbanMemberFromBubbleMutation($bubble_id: Int!, $user_id: Int!) {
    unbanMemberFromBubble(input: { bubble_id: $bubble_id, user_id: $user_id }) {
      status
    }
  }
`;

export default (container) => (
  compose(
    graphql(getBubbleUsers, {
      options: (ownProps) => ({
        variables: {
          permalink: ownProps.bubble.permalink,
        },
      }),
    }),
    graphql(removeMember, {
      name: 'removeMember',
    }),
    graphql(makeAdmin, {
      name: 'makeAdmin',
    }),
    graphql(banMember, {
      name: 'banMember',
    }),
    graphql(unbanMember, {
      name: 'unbanMember',
    }),
  )(withRouter(container))
);
