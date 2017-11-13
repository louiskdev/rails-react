/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import gql from 'graphql-tag';
import { notify } from 'react-notify-toast';
import FeedItem from '@common/FeedItem';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class BubbleFeed extends Component {

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

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    this.subscribeToPusherChannel();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    this.unsubscribeFromPusherChannel();
  }

  componentWillMount() {
    if (this.props.counters) {
      this.clearCounters();
    }
  }

  subscribeToPusherChannel = () => {
    const pusher = this.context.pusher;
    const channel = this.context.globalChannel;

    let bubbleChannel = pusher.channels.channels['private-bubble-' + this.props.bubbleName];
    if (!bubbleChannel) {
      bubbleChannel = pusher.subscribe('private-bubble-' + this.props.bubbleName);
    }

    channel.bind('rating_changed', this.onRatingChanged);
    bubbleChannel.bind('feed_item_added', this.onFeedItemAdded);
    bubbleChannel.bind('post_removed', this.onFeedItemRemoved);
    bubbleChannel.bind('activity_removed', this.handleActivityRemoved);
    bubbleChannel.bind('activity_undo_hidden', this.handleActivityUndoHidden);
  }

  unsubscribeFromPusherChannel = () => {
    const pusher = this.context.pusher;
    const bubbleChannel = pusher.channels.channels['private-bubble-' + this.props.bubbleName];
    if (bubbleChannel) {
      bubbleChannel.unbind('feed_item_added', this.onFeedItemAdded);
      bubbleChannel.unbind('post_removed', this.onFeedItemRemoved);
      bubbleChannel.unbind('activity_removed', this.handleActivityRemoved);
      bubbleChannel.unbind('activity_undo_hidden', this.handleActivityUndoHidden);
      // pusher.unsubscribe('private-bubble-'+this.props.bubbleName);
    }
    const channel = this.context.globalChannel;
    channel.unbind('rating_changed', this.onRatingChanged);
  }

  handleActivityRemoved = (data) => {
    const _feedsInit = this.getFeeds();
    const feeds = JSON.parse(JSON.stringify(_feedsInit));
    const newFeeds = [];
    const id = data.activity_id;
    for (let i = 0; i < feeds.length; i++) {
      if (feeds[i].node.id != id) {
        newFeeds.push(feeds[i]);
      }
    }
    this.setState({
      feeds: newFeeds,
    });
    this.props.data.refetch();
  }

  handleActivityUndoHidden = (data) => {
    this.setState({
      feeds: [],
    });
    this.props.data.refetch();
  }

  onRatingChanged = (data) => {
    const _feedsInit = this.getFeeds();
    const feeds = JSON.parse(JSON.stringify(_feedsInit));
    for (let i = 0; i < feeds.length; i++) {
      let feeditem = feeds[i].node.o_post;
      if (feeds[i].node.o_medium) {
        feeditem = feeds[i].node.o_medium;
      }
      if (feeditem && parseInt(feeditem.id, 10) === data.message.object_id) {
        this.updateFeedStatus(i, {
          raters_count: data.message.raters_count,
          rating: data.message.rating,
        });
        break;
      }
    }
  }

  onFeedItemAdded = (data) => {
    this.props.data.refetch();
  }

  onFeedItemRemoved = (data) => {
    const postData = data.note_data ? data.note_data : data.post_data;
    const activityIds = postData.activity_ids ? postData.activity_ids : [];
    const _feedsInit = this.getFeeds();
    const feeds = JSON.parse(JSON.stringify(_feedsInit));
    for (let i = 0; i < feeds.length; i++) {
      if (activityIds.includes(parseInt(feeds[i].node.id))) {
        feeds.splice(i, 1);
      }
    }
    this.setState({
      feeds,
    });
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

  handleInfiniteLoad = () => {
    const _feedsInit = this.getFeeds();
    let _feeds = JSON.parse(JSON.stringify(_feedsInit));
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
        query getBubbleFeed($permalink: String!, $lastCursor: String!) {
          bubble_feed(permalink: $permalink, first: 10, before: $lastCursor) {
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
                  avatar_url
                }
                originalAuthor {
                  id
                  username
                  avatar_url
                }
                bubble {
                  name
                  permalink
                  description
                  avatar_url
                }

                o_post {
                  author {
                    id
                    username
                    avatar_url
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
                  avatar_url
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
                  avatar_url
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
        permalink: this.props.bubbleName,
      },
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
        if (data.bubble_feed) {
          data.bubble_feed.edges.forEach((feed) => {
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
    const { feeds } = this.state;
    if (feeds.length > 0) {
      return feeds;
    }
    else {
      const { bubble_feed } = this.props.data;
      return bubble_feed && bubble_feed.edges.length > 0 ? bubble_feed.edges : [];
    }
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
      if (_feeds[index].node.o_post) {
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
      feed_unread_items_count: 0,
    });
  }

  undoHidden = () => {
    this.props.undoHiddenActivity();
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
    if (!this.props.data.bubble_feed) {
      return (
        <div>
          Bubble feed loading...
        </div>
      );
    }
    else {
      const _feeds = this.getFeeds();
      const hiddenPostsCount = this.props.data.hidden_posts_count.count;
      const { bubbleType } = this.props;

      if (_feeds.length > 0) {
        return (
          <div className='myb-feeds'>
            {
              hiddenPostsCount > 0 ?
              <div className='myb-message hidden-post-message'>
                {hiddenPostsCount} {hiddenPostsCount == 1 ? 'post' : 'posts'} hidden. <a href='javascript:;' onClick={this.undoHidden}>Undo</a>
              </div>
              :
              ''
            }
            {
              _feeds.map((feed, index) => {
                if (feed.node) {
                  const randValue = this.state.updatedIndex === index ? Math.random() * 1000 : 0;
                  return (
                    <FeedItem
                      key={index} index={index} randProp={randValue}
                      feednode={feed.node}
                      feed_location='bubble_feed'
                      ratable
                      admin={this.props.admin}
                      noshare={bubbleType === 'privy'}
                      updateFeedStatus={this.updateFeedStatus}
                      updateNoteAndEndEditing={this.updateNoteAndEndEditing}
                      enableReply={this.enableReply} />
                  );
                }
              })
            }
          </div>
        );
      }
      else {
        return (
          <div className='myb-feeds'>
            {
              hiddenPostsCount > 0 ?
              <div className='myb-message hidden-post-message'>
                {hiddenPostsCount} {hiddenPostsCount == 1 ? 'post' : 'posts'} hidden. <a href='javascript:;' onClick={this.undoHidden}>Undo</a>
              </div>
              :
              ''
            }
            <div className='myb-message empty'>
              <div className='message-inner'>
                This is a brand new bubble. Be the first to post.
              </div>
            </div>
          </div>
        );
      }
    }
  }
}

export default withApollo(hoc(BubbleFeed));
