/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';
import gql from 'graphql-tag';
import { notify } from 'react-notify-toast';
import IconButton from 'material-ui/IconButton';
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more';
import transitions from 'material-ui/styles/transitions';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import FeedItem from '@common/FeedItem';
import { feedItemResult } from '@utils/queryHelpers';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class HashtagFeed extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
    globalChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      firstFeedLoaded: false,
      infiniteLoading: false,
      feeds: [],
      updatedIndex: -1,
      sort_by: '',
      privacy: '',
      clickedRemove: false,
      expand: false,
    };
  }

  listenPusher = () => {
    const { loading, currentUser } = this.props.data;
    if (loading || !currentUser) {
      return;
    }
    if (this.pusherChannelOpened) {
      return;
    }
    this.pusherChannelOpened = true;

    const userChannel = this.context.userChannel;
    userChannel.bind('important', this.handleUserChannelNotification);

    const globalChannel = this.context.globalChannel;
    globalChannel.bind('rating_changed', this.handleRatingChanged);
    globalChannel.bind('hashtag_added', this.handleHashtagFeedAdded);

    const pusher = this.context.pusher;
    let dashChannel = pusher.channels.channels['private-dashboard-' + currentUser.id];
    if (!dashChannel) {
      dashChannel = pusher.subscribe('private-dashboard-' + currentUser.id);
    }
    dashChannel.bind('activity_undo_hidden', this.handleActivityUndoHidden);
  }

  unlistenPusher = () => {
    const { loading, currentUser } = this.props.data;
    if (loading || !currentUser) {
      return;
    }
    this.pusherChannelOpened = false;

    const userChannel = this.context.userChannel;
    userChannel.unbind('important', this.handleUserChannelNotification);

    const globalChannel = this.context.globalChannel;
    globalChannel.unbind('rating_changed', this.handleRatingChanged);
    globalChannel.unbind('hashtag_added', this.handleHashtagFeedAdded);

    const userId = currentUser.id;
    const pusher = this.context.pusher;
    const dashChannel = pusher.channels.channels['private-dashboard-' + currentUser.id];
    if (dashChannel) {
      dashChannel.unbind('activity_undo_hidden', this.handleActivityUndoHidden);
    }

  }

  handleUserChannelNotification = (data) => {
    if (data.message === 'need_to_reload_notifications') {
      this.props.data.refetch();
    }
  }

  handleHashtagFeedAdded = (data) => {
    console.log('handleHashtagFeedAdded');// /
    console.log(data);// /
    const hashtags = data.hashtags ? data.hashtags : [];
    const { hashtag } = this.props;
    if (hashtags.indexOf(hashtag) >= 0) {
      this.props.data.refetch();
    }
  }

  handleRatingChanged = (data) => {
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
  }

  handleActivityUndoHidden = (data) => {
    this.setState({
      feeds: [],
    });
    this.props.data.refetch();
  }

  refetchHashtagFeed = () => {
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

  handleFilterChange = (filter) => {
    this.handleReloadFeed(filter, this.state.sort_by);
  }

  handleSortChange = (sort_by) => {
    this.handleReloadFeed(this.state.privacy, sort_by);
  }

  handleReloadFeed = (privacy, sort_by) => {
    const self = this;
    this.setState({
      privacy,
      sort_by,
      feeds: [],
    });
    setTimeout(() => {
      this.props.data.refetch({ privacy: privacy, sort_by: sort_by });
    }, 0);
  }

  handleInfiniteLoad = () => {
    const _feeds = this.getFeeds();
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
        query getHashtagFeed($lastCursor: String!, $hashtag: String!) {
          hashtag_feed(first: 10, hashtag: $hashtag, after: $lastCursor) {
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
        hashtag: this.props.hashtag,
        // sort_by: this.state.sort_by || '',
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
        if (data.hashtag_feed) {
          data.hashtag_feed.edges.forEach((feed) => {
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
      const { hashtag_feed } = this.props.data;
      return hashtag_feed && hashtag_feed.edges.length > 0 ? hashtag_feed.edges : [];
    }
  }

  updateFeedStatus = (index, values = { }) => {
    const _feeds = this.getFeeds();
    if (_feeds[index]) {
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
    const _feeds = this.getFeeds();
    if (_feeds[feedIndex]) {
      const itemObj = _feeds[feedIndex].node.o_note ||
        _feeds[feedIndex].node.o_post ||
        _feeds[feedIndex].node.o_event ||
        _feeds[feedIndex].node.o_medium;
      if (itemObj.comments && itemObj.comments[commentIndex]) {
        itemObj.comments[commentIndex].node.replyEnabled = true;
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

  handleTouchTap = () => {
    this.setState({
      expand: !this.state.expand,
    });
  };

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    this.unlistenPusher();
  }

  componentDidUpdate() {
    this.listenPusher();
  }

  componentWillReceiveProps(nextProps) {
    const feeds = this.state.feeds;
    if (feeds.length > 0) {
      if (this.props.data.loading && !nextProps.data.loading) {
        this.setState({
          feeds: [],
        });
      }
      else {
        const topFeedInState = feeds[0].node;
        const { hashtag_feed } = nextProps.data;
        let insertPos = 0;
        if (!hashtag_feed) {
          return;
        }
        hashtag_feed.edges.every(feed => {
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
    const codeBlockTitle = {
      cursor: 'pointer',
    };

    const styles = {
      markdown: {
        overflow: 'auto',
        maxHeight: 1400,
        transition: transitions.create('max-height', '200ms', '0ms', 'ease-in-out'),
        marginTop: 0,
        marginBottom: 0,
        width: '100%',
      },
      markdownRetracted: {
        maxHeight: 0,
      },
    };

    let codeStyle = Object.assign({}, styles.markdown, styles.markdownRetracted);

    if (this.state.expand) {
      codeStyle = styles.markdown;
    }

    if (!this.props.data.hashtag_feed && !this.state.feeds.length) {
      return (
        <div className='myb-feeds'>
          <div className='search-filters-panel'>
            <div onTouchTap={this.handleTouchTap} style={codeBlockTitle}>
              <Toolbar style={CommonStyles.filters.toolbar}>
                <ToolbarGroup>
                  <IconButton touch style={CommonStyles.filters.icon}>
                    <NavigationExpandMoreIcon />
                  </IconButton>
                  <ToolbarTitle text='Filters' style={CommonStyles.filters.title} />
                </ToolbarGroup>
              </Toolbar>
            </div>

            <div className='filters-block' style={codeStyle}>
              <div className='filters-block-wrapper'>
                <div className='filter-sort-block'>
                  <div className='filters'>
                    <a className={this.state.sort_by === '' ? 'active' : ''} onClick={this.handleSortChange.bind(this, '')}>Newest</a>
                    <a className={this.state.sort_by === 'rating' ? 'active' : ''} onClick={this.handleSortChange.bind(this, 'rating')}>Popular</a>
                    {/* <a className={this.state.sort_by === 'favourite' ? 'active' : ''} onClick={this.handleSortChange.bind(this, 'favourite')}>Favorite</a>*/}
                    <a className='inactive'>Favorite</a>
                    <div className='sort'>
                      <a className={this.state.privacy === '' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, '')}>All</a>
                      <a className={this.state.privacy === 'public' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, 'public')}>Public</a>
                      <a className={this.state.privacy === 'private' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, 'private')}>Private</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          Hashtag feed loading ...
        </div>
      );
    }
    else {
      const _feeds = this.getFeeds();
      const hiddenPostsCount = this.props.data.hidden_posts_count ? this.props.data.hidden_posts_count.count : 0;

      if (_feeds.length > 0) {
        // Cache hashtag feed data, disabled temp
        if (localStorage.getItem('mbubblz_activeCache')) {
          const activeCacheObject = JSON.parse(localStorage.getItem('mbubblz_activeCache'));
          activeCacheObject.hashtagFeed = false;
          localStorage.setItem('mbubblz_activeCache', JSON.stringify(activeCacheObject));
        }

        return (
          <div className='myb-feeds'>
            <div className='search-filters-panel'>
              <div onTouchTap={this.handleTouchTap} style={codeBlockTitle}>
                <Toolbar style={CommonStyles.filters.toolbar}>
                  <ToolbarGroup>
                    <IconButton touch style={CommonStyles.filters.icon}>
                      <NavigationExpandMoreIcon />
                    </IconButton>
                    <ToolbarTitle text='Filters' style={CommonStyles.filters.title} />
                  </ToolbarGroup>
                </Toolbar>
              </div>

              <div className='filters-block' style={codeStyle}>
                <div className='filters-block-wrapper'>
                  <div className='filter-sort-block'>
                    <div className='filters'>
                      <a className={this.state.sort_by === '' ? 'active' : ''} onClick={this.handleSortChange.bind(this, '')}>Newest</a>
                      <a className={this.state.sort_by === 'rating' ? 'active' : ''} onClick={this.handleSortChange.bind(this, 'rating')}>Popular</a>
                      {/* <a className={this.state.sort_by === 'favourite' ? 'active' : ''} onClick={this.handleSortChange.bind(this, 'favourite')}>Favorite</a>*/}
                      <a className='inactive'>Favorite</a>
                      <div className='sort'>
                        <a className={this.state.privacy === '' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, '')}>All</a>
                        <a className={this.state.privacy === 'public' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, 'public')}>Public</a>
                        <a className={this.state.privacy === 'private' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, 'private')}>Private</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {this.props.loadMorePosts > 0 ?
              <FlatButton
                className='load-more-posts blink'
                backgroundColor='#62db95'
                hoverColor='#8fdeb0'
                style={{ width: '100%', color: '#ffffff' }}
                onTouchTap={this.refetchHashtagFeed}
              >
                Show {this.props.loadMorePosts} new posts
              </FlatButton>
              :
              ''
            }
            {
              hiddenPostsCount > 0 ?
              <div className='myb-message hidden-post-message'>
                {hiddenPostsCount} {hiddenPostsCount == 1 ? 'post' : 'posts'} hidden. <a href='javascript:;' onClick={this.undoHidden}>Undo</a>
              </div>
              :
              ''
            }
            {
              _feeds.map((feed, index)=>{
                if (feed.node) {
                  const randValue = this.state.updatedIndex === index ? Math.random() * 1000 : 0;

                  return (
                    <FeedItem
                      key={index} index={index} randProp={randValue}
                      feednode={feed.node}
                      feed_location='hashtag_feed'
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
      else if (_feeds.length === 0 && (this.state.sort_by !== '' || this.state.privacy !== '')) {
        return (
          <div className='myb-feeds'>
            <div className='search-filters-panel'>
              <div onTouchTap={this.handleTouchTap} style={codeBlockTitle}>
                <Toolbar style={CommonStyles.filters.toolbar}>
                  <ToolbarGroup>
                    <IconButton touch style={CommonStyles.filters.icon}>
                      <NavigationExpandMoreIcon />
                    </IconButton>
                    <ToolbarTitle text='Filters' style={CommonStyles.filters.title} />
                  </ToolbarGroup>
                </Toolbar>
              </div>

              <div className='filters-block' style={codeStyle}>
                <div className='filters-block-wrapper'>
                  <div className='filter-sort-block'>
                    <div className='filters'>
                      <a className={this.state.sort_by === '' ? 'active' : ''} onClick={this.handleSortChange.bind(this, '')}>Newest</a>
                      <a className={this.state.sort_by === 'rating' ? 'active' : ''} onClick={this.handleSortChange.bind(this, 'rating')}>Popular</a>
                      {/* <a className={this.state.sort_by === 'favourite' ? 'active' : ''} onClick={this.handleSortChange.bind(this, 'favourite')}>Favorite</a>*/}
                      <a className='inactive'>Favorite</a>
                      <div className='sort'>
                        <a className={this.state.privacy === '' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, '')}>All</a>
                        <a className={this.state.privacy === 'public' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, 'public')}>Public</a>
                        <a className={this.state.privacy === 'private' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, 'private')}>Private</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {
              hiddenPostsCount > 0 ?
              <div className='myb-message hidden-post-message'>
                {hiddenPostsCount} {hiddenPostsCount == 1 ? 'post' : 'posts'} hidden. <a href='javascript:;' onClick={this.undoHidden}>Undo</a>
              </div>
              :
              ''
            }
            No items found
          </div>
        );
      }
      else {
        return (
          <div className='myb-feeds'>
            <div className='search-filters-panel'>
              <div onTouchTap={this.handleTouchTap} style={codeBlockTitle}>
                <Toolbar style={CommonStyles.filters.toolbar}>
                  <ToolbarGroup>
                    <IconButton touch style={CommonStyles.filters.icon}>
                      <NavigationExpandMoreIcon />
                    </IconButton>
                    <ToolbarTitle text='Filters' style={CommonStyles.filters.title} />
                  </ToolbarGroup>
                </Toolbar>
              </div>

              <div className='filters-block' style={codeStyle}>
                <div className='filters-block-wrapper'>
                  <div className='filter-sort-block'>
                    <div className='filters'>
                      <a className={this.state.sort_by === '' ? 'active' : ''} onClick={this.handleSortChange.bind(this, '')}>Newest</a>
                      <a className={this.state.sort_by === 'rating' ? 'active' : ''} onClick={this.handleSortChange.bind(this, 'rating')}>Popular</a>
                      {/* <a className={this.state.sort_by === 'favourite' ? 'active' : ''} onClick={this.handleSortChange.bind(this, 'favourite')}>Favorite</a>*/}
                      <a className='inactive'>Favorite</a>
                      <div className='sort'>
                        <a className={this.state.privacy === '' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, '')}>All</a>
                        <a className={this.state.privacy === 'public' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, 'public')}>Public</a>
                        <a className={this.state.privacy === 'private' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, 'private')}>Private</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='myb-message empty'>
              <div className='message-inner'>
                This hashtag has no related posts yet
              </div>
            </div>
          </div>
        );
      }
    }
  }
}

export default withApollo(hoc(HashtagFeed));
