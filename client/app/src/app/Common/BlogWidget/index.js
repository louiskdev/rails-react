/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import gql from 'graphql-tag';
import { notify } from 'react-notify-toast';
import CreatePost from '@common/CreatePost';
import FeedItem from '@common/FeedItem';
import update from 'react-addons-update';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class BlogWidget extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    globalChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      firstFeedLoaded: false,
      infiniteLoading: false,
      feeds: [],
      updatedIndex: -1,
    };
  }

  state: State

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    this.listenPusher();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    this.unlistenPusher();
  }

  componentWillMount() {
    if (this.props.counters) {
      this.clearCounters();
    }
  }

  listenPusher = () => {
    const pusher = this.context.pusher;
    const channel = this.context.globalChannel;
    channel.bind('rating_changed', (data) => {
      const feeds = this.getFeeds();
      for (let i = 0; i < feeds.length; i++) {
        if (feeds[i].node.o_post && feeds[i].node.o_post.id === data.message.object_id) {
          this.updateFeedStatus(i, {
            raters_count: data.message.raters_count,
            rating: data.message.rating,
          });
          break;
        }
      }
    });

    let bubbleChannel = pusher.channels.channels['private-bubble-' + this.props.bubbleName];
    if (!bubbleChannel) {
      bubbleChannel = pusher.subscribe('private-bubble-' + this.props.bubbleName);
    }
    bubbleChannel.bind('feed_item_added', this.onFeedItemAdded);
    bubbleChannel.bind('post_removed', this.onFeedItemRemoved);
  }

  unlistenPusher = () => {
    const pusher = this.context.pusher;
    const channel = this.context.globalChannel;
    channel.unbind('rating_changed');

    const bubbleChannel = pusher.channels.channels['private-bubble-' + this.props.bubbleName];
    if (bubbleChannel) {
      bubbleChannel.unbind('feed_item_added', this.onFeedItemAdded);
      bubbleChannel.unbind('post_removed', this.onFeedItemRemoved);
    }
  }

  handleScroll = () => {
    const doc = document.documentElement;
    const body = document.body;
    const height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      doc.clientHeight,
      doc.scrollHeight,
      doc.offsetHeight,
    );
    const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    const offset = window.innerHeight + 200;
    if (top > height - offset && !this.state.infiniteLoading) {
      this.handleInfiniteLoad();
    }
  }

  onFeedItemAdded = (data) => {
    const username = JSON.parse(localStorage.getItem('mbubblz_user')).username;
    if (data.feed[0].user.username !== username) {
      this.props.data.refetch();
    }
  }

  onFeedItemRemoved = (data) => {
    const postData = data.note_data ? data.note_data : data.post_data;
    const activityIds = postData.activity_ids ? postData.activity_ids : [];
    const _feedsInit = this.getFeeds();
    const feeds = JSON.parse(JSON.stringify(_feedsInit));
    for (let i = 0; i < feeds.length; i++) {
      if (activityIds.includes(parseInt(feeds[i].node.id))) {
        feeds.splice(i, 1);
        this.setState({
          feeds,
          updatedIndex: i,
        });
      }
    }
  }

  updateWithNewPost = (data) => {

    const newFeedItem = {
      cursor: null,
      node: data.createBlogPost.activity,
    };
    const _feedsInit = this.getFeeds();
    const _feeds = JSON.parse(JSON.stringify(_feedsInit));

    this.setState({
      feeds: update([newFeedItem], { $push: _feeds }),
    });

  }

  handleInfiniteLoad = () => {
    const _feedsInit = this.getFeeds();
    let _feeds = JSON.parse(JSON.stringify(_feedsInit));
    if (!_feeds.length) {
      _feeds = this.props.data.postsFromBlog ? this.props.data.postsFromBlog.edges : [];
    }
    if (!_feeds.length) {
      return;
    }
    if (_feeds.length < 10) {
      return;
    }
    if (this.state.infiniteLoading) {
      return;
    }
    this.setState({
      infiniteLoading: true,
    });
    this.props.client.query({
      query: gql`
        query getBlogFeed($lastCursor: String!, $blog_id: Int!) {
          postsFromBlog(first: 10, after: $lastCursor, blog_id: $blog_id) {
            edges {
              cursor
              node {
                id
                name
                user_friendly_name
                user_id
                bubble_id
                object_type
                object_id
                feed
                privacy
                created_at
                author {
                  id
                  username
                  avatar_url(version: "micro")
                }
                originalAuthor {
                  id
                  username
                  avatar_url(version: "micro")
                }
                bubble {
                  name
                  permalink
                  description
                  avatar_url(version: "micro")
                }

                o_post {
                  author {
                    id
                    username
                    avatar_url(version: "micro")
                  }
                  comments_count
                  created_at
                  id
                  liked
                  likes_count
                  link_preview {
                    description
                    id
                    picture_url
                    title
                    url
                  }
                  medium {
                    id
                    picture_url
                    thumb_url
                    video_links
                    recoding_job_id
                  }
                  raters_count
                  rating
                  text
                  updated_at
                  user_id
                  user_rating
                  visits_count
                }

                o_bubble {
                  avatar_url(version: "micro")
                  description
                  kind
                  liked
                  likes_count
                  name
                  permalink
                  type
                }

                o_medium {
                  comments_count
                  id
                  liked
                  likes_count
                  picture_url
                  recoding_job_id
                  type
                  user_id
                  video_links
                  visits_count
                }

                o_album {
                  avatar_url(version: "micro")
                  description
                  id
                  name
                }
              }
            }
          }
        }
      `,
      variables: {
        lastCursor: _feeds[_feeds.length - 1].cursor,
        blog_id: this.props.blogId,
      },
      forceFetch: true,
    }).then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
        this.setState({
          infiniteLoading: false,
        });
      }
      else {

        // Update feed data
        if (data.postsFromBlog) {
          data.postsFromBlog.edges.forEach((feed) => {
            _feeds.push(feed);
          });
        }
        this.setState({
          infiniteLoading: false,
          feeds: _feeds,
        });
      }

    }).catch((error) => {

      notify.show(error.message, 'error', 2000);

      this.setState({
        infiniteLoading: false,
      });

    });
  }

  getFeeds = () => {
    const { postsFromBlog } = this.props.data;
    const { feeds } = this.state;
    return feeds.length ? feeds : postsFromBlog.edges;
  }

  updateFeedStatus = (index, values = { }) => {
    const _feedsInit = this.getFeeds();
    if (_feedsInit[index]) {
      const _feeds = JSON.parse(JSON.stringify(_feedsInit));
      for (const key in values) {
        if (_feeds[index].node.o_note) {
          _feeds[index].node.o_note[key] = values[key];
        }
        if (_feeds[index].node.o_medium) {
          _feeds[index].node.o_medium[key] = values[key];
        }
        if (_feeds[index].node.o_post) {
          _feeds[index].node.o_post[key] = values[key];
        }
        if (_feeds[index].node.o_event) {
          _feeds[index].node.o_event[key] = values[key];
        }
      }
      this.setState({
        feeds: _feeds,
        updatedIndex: index,
      });
    }
  }

  updateNoteAndEndEditing = (index, vars) => {
    const _feedsInit = this.getFeeds();
    const _feeds = JSON.parse(JSON.stringify(_feedsInit));
    if (_feeds[index]) {
      _feeds[index].node.o_post.text = vars.text;
      if (vars.link_url) {
        const link_preview = {
          description: vars.link_description || '',
          picture_url: vars.link_picture_url || '',
          title: vars.link_title || '',
          url: vars.link_url,
        };
        _feeds[index].node.o_post.link_preview = link_preview;
      }
      else {
        _feeds[index].node.o_post.link_preview = null;
      }
      _feeds[index].node.o_post.editingText = false;
    }
    this.setState({
      feeds: _feeds,
      updatedIndex: index,
    });
  }

  removeFeedItem = (index) => {
    const _feedsInit = this.getFeeds();
    const _feeds = JSON.parse(JSON.stringify(_feedsInit));
    if (_feeds[index]) {
      _feeds.splice(index, 1);
      this.setState({
        feeds: _feeds,
        updatedIndex: index,
      });
    }
  }

  enableReply = (feedIndex, commentIndex) => {
    const _feedsInit = this.getFeeds();
    if (_feedsInit[feedIndex]) {
      const _feeds = JSON.parse(JSON.stringify(_feedsInit));
      const itemObj = _feeds[feedIndex].node.o_note ||
        _feeds[feedIndex].node.o_post ||
        _feeds[feedIndex].node.o_event ||
        _feeds[feedIndex].node.o_album ||
        _feeds[feedIndex].node.o_medium;
      if (itemObj.comments && itemObj.comments.edges[commentIndex]) {
        itemObj.comments.edges[commentIndex].node.replyEnabled = true;
        this.setState({
          feeds: _feeds,
          updatedIndex: feedIndex,
        });
      }
    }
  }

  clearCounters = () => {
    this.props.changeCounter({
      ...this.props.counters,
      blog_unread_items_count: 0,
    });
  }

  render() {

    if (this.props.data.errors) {
      if (this.props.data.errors.graphQLErrors && this.props.data.errors.graphQLErrors[0].message === 'User is unauthorized') {
        setTimeout(() => {
          this.props.router.push('/signin');
        }, 50);
        setTimeout(()=> {
          localStorage.setItem('mbubblz_client_id', '');
          localStorage.setItem('mbubblz_token', '');
          localStorage.setItem('mbubblz_user', '');
          localStorage.setItem('mbubblz_username', '');
        }, 1000);
        return;
      }
    }

    const { blogId } = this.props;

    if (!this.props.data.postsFromBlog) {
      return (
        <div className='myb-feeds'>
          <div className='myb-feeds-wrapper'>
            <CreatePost blogId={blogId} updateFeed={this.updateWithNewPost.bind(this)} />
          </div>
          Blog feed loading ...
        </div>
      );
    }
    else {
      const _feeds = this.getFeeds();

      return (
        <div className='myb-feeds'>
          <div className='myb-feeds-wrapper'>
            <CreatePost blogId={blogId} updateFeed={this.updateWithNewPost.bind(this)} />
            {
              _feeds.length > 0 ?
              _feeds.map((feed, index) => {
                if (feed.node) {
                  const randValue = this.state.updatedIndex === index ? Math.random() * 1000 : 0;
                  return (
                    <FeedItem
                      key={index}
                      index={index}
                      randProp={randValue}
                      ratable
                      admin={this.props.admin}
                      feednode={feed.node}
                      feed_location='blog_feed'
                      updateFeedStatus={this.updateFeedStatus}
                      updateNoteAndEndEditing={this.updateNoteAndEndEditing}
                      removeFeedItem={this.removeFeedItem}
                      enableReply={this.enableReply}
                    />
                  );
                }
              })
              :
              <div className='myb-feeds'>
                <div className='myb-message empty'>
                  <div className='message-inner'>
                    There are no posts yet
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      );

    }
  }

}

export default withApollo(hoc(BlogWidget));
