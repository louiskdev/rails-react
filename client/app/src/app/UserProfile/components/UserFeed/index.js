/* @flow */

import React, { Component } from 'react';
import gql from 'graphql-tag';
import { notify } from 'react-notify-toast';
import FeedItem from '@common/FeedItem';
import { feedItemResult } from '@utils/queryHelpers';
import { withApollo } from 'react-apollo';
import hoc from './hoc';

class UserFeed extends Component {

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
    this.listenGlobalChannel();
    this.subscribeToPusher();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    this.unsubscribeFromPusher();
  }

  componentWillReceiveProps(nextProps) {
    const _feedsInit = this.state.feeds;
    const feeds = JSON.parse(JSON.stringify(_feedsInit));

    if (feeds.length > 0) {
      const topFeedInState = feeds[0].node;
      const { user_feed } = nextProps.data;
      let insertPos = 0;
      if (!user_feed) {
        return;
      }
      user_feed.edges.every(feed => {
        if (feed.node.id === topFeedInState.id) {
          return false;
        }
        feeds.splice(insertPos, 0, feed);
        insertPos++;
        return true;
      });
      this.setState({
        feeds,
      });
    }
  }

  listenGlobalChannel = () => {
    const channel = this.context.globalChannel;
    channel.bind('rating_changed', (data) => {
      const feeds = this.getFeeds();
      for (let i = 0; i < feeds.length; i++) {
        let feeditem = feeds[i].node.o_note;
        if (feeds[i].node.o_post) {
          feeditem = feeds[i].node.o_post;
        }
        else if (feeds[i].node.o_medium) {
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
    });
  }

  refresh = (data) => {
    this.props.data.refetch();
  }

  subscribeToPusher = () => {
    const pusher = this.context.pusher;
    let dashChannel = pusher.channels.channels['private-dashboard-' + this.props.userid];
    if (!dashChannel) {
      dashChannel = pusher.subscribe('private-dashboard-' + this.props.userid);
    }
    dashChannel.bind('feed_item_added', this.refresh);
    dashChannel.bind('feed_item_removed', this.onFeedItemRemoved);
    dashChannel.bind('activity_removed', this.handleActivityRemoved);
    dashChannel.bind('activity_undo_hidden', this.handleActivityUndoHidden);
  }

  unsubscribeFromPusher = () => {
    const pusher = this.context.pusher;
    const dashChannel = pusher.channels.channels['private-dashboard-' + this.props.userid];
    if (dashChannel) {
      dashChannel.unbind('feed_item_added', this.refresh);
      dashChannel.unbind('feed_item_removed', this.onFeedItemRemoved);
      dashChannel.unbind('activity_removed', this.handleActivityRemoved);
      dashChannel.unbind('activity_undo_hidden', this.handleActivityUndoHidden);
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
      }
    }
    this.setState({
      feeds,
    });
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
    const _feeds = JSON.parse(JSON.stringify(_feedsInit));
    if (!_feeds.length) {
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
        query getUserFeed($lastCursor: String!, $username: String!) {
          user_feed(first: 10, before: $lastCursor, username: $username) {
            edges {
              cursor
              node {
                ${feedItemResult}
              }
            }
          }
        }
      `,
      variables: {
        lastCursor: _feeds[_feeds.length - 1].cursor,
        username: this.props.username,
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
        if (data.user_feed) {
          data.user_feed.edges.forEach((feed) => {
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
      const { user_feed } = this.props.data;
      return user_feed && user_feed.edges.length > 0 ? user_feed.edges : [];
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

  enableReply = (feedIndex, commentIndex) => {
    const _feedsInit = this.getFeeds();
    const _feeds = JSON.parse(JSON.stringify(_feedsInit));
    if (_feeds[feedIndex]) {
      const itemObj = _feeds[feedIndex].node.o_note ||
        _feeds[feedIndex].node.o_post ||
        _feeds[feedIndex].node.o_event ||
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

  undoHidden = () => {
    this.props.undoHiddenActivity();
  }

  render() {

    if (!this.props.data.user_feed) {
      return (
        <div>
          User feed loading...
        </div>
      );
    }
    else {
      const { user_feed } = this.props.data;
      const hiddenPostsCount = this.props.data.hidden_posts_count.count;
      const { feeds } = this.state;
      let _feeds = [];
      if (feeds.length) {
        _feeds = feeds;
      }
      else if (user_feed) {
        _feeds = user_feed.edges;
      }

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
                      feed_location='user_feed'
                      ratable
                      updateFeedStatus={this.updateFeedStatus}
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
                No notes yet
              </div>
            </div>
          </div>
        );
      }
    }
  }
}

export default withApollo(hoc(UserFeed));
