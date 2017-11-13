/* @flow */
/* eslint-disable max-len */

import { graphql } from 'react-apollo';
import { withRouter } from 'react-router';
import gql from 'graphql-tag';
import { feedItemResult } from '@utils/queryHelpers';

const getPostsFromBlog = gql`
  query getPostsFromBlog($blog_id: Int!) {
    postsFromBlog(first: 10, blog_id: $blog_id) {
      edges {
        cursor
        node {
          ${feedItemResult}
        }
      }
    }
  }
`;

export default (container) => (
  graphql(getPostsFromBlog, {
    options: (ownProps) => ({
      variables: {
        blog_id: ownProps.blogId,
      },
      forceFetch: true,
      activeCache: false,
    }),
  })(withRouter(container))
);
