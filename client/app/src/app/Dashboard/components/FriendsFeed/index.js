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
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class FriendsFeed extends Component {

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

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    this.unlistenPusher();
  }

  componentDidUpdate() {
    this.listenPusher();
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
    userChannel.bind('important', (data) => {
      if (data.message === 'need_to_reload_notifications') {
        this.props.data.refetch();
      }
    });
    const globalChannel = this.context.globalChannel;
    globalChannel.bind('rating_changed', (data) => {
      const _feedsInit = this.getFeeds();
      const feeds = JSON.parse(JSON.stringify(_feedsInit));

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
    const pusher = this.context.pusher;
    let dashChannel = pusher.channels.channels['private-dashboard-' + currentUser.id];
    if (!dashChannel) {
      dashChannel = pusher.subscribe('private-dashboard-' + currentUser.id);
    }
    dashChannel.bind('note_removed', this.onFeedItemRemoved);
    dashChannel.bind('post_removed', this.onFeedItemRemoved);
    dashChannel.bind('activity_removed', this.handleActivityRemoved);
    dashChannel.bind('activity_undo_hidden', this.handleActivityUndoHidden);
  }

  unlistenPusher = () => {
    const { loading, currentUser } = this.props.data;
    if (loading || !currentUser) {
      return;
    }
    this.pusherChannelOpened = false;
    const userId = currentUser.id;
    const userChannel = this.context.userChannel;
    const globalChannel = this.context.globalChannel;
    userChannel.unbind('important');
    globalChannel.unbind('rating_changed');

    const pusher = this.context.pusher;
    const dashChannel = pusher.channels.channels['private-dashboard-' + currentUser.id];
    if (dashChannel) {
      dashChannel.unbind('note_removed', this.onFeedItemRemoved);
      dashChannel.unbind('post_removed', this.onFeedItemRemoved);
      dashChannel.unbind('activity_removed', this.handleActivityRemoved);
      dashChannel.unbind('activity_undo_hidden', this.handleActivityUndoHidden);
    }

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

  refetchFriendsFeed = () => {
    this.setState({
      feeds: [],
    });
    this.props.data.refetch();
    this.props.setUnreadPosts(0);
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
        query getFriendsFeed($lastCursor: String!, $privacy: String!, $sort_by: String!) {
          currentUser {
            id
          }
          friends_feed(first: 10, privacy: $privacy, sort_by: $sort_by, before: $lastCursor) {
            unread_activities_count
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
        privacy: this.state.privacy || '',
        sort_by: this.state.sort_by || '',
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
        if (data.friends_feed) {
          data.friends_feed.edges.forEach((feed) => {
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
      const { friends_feed } = this.props.data;
      return friends_feed && friends_feed.edges.length > 0 ? friends_feed.edges : [];
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
        if (_feeds[index].node.o_album) {
          _feeds[index].node.o_album[key] = values[key];
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

  undoHidden = () => {
    this.props.undoHiddenActivity();
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    this.props.setUnreadPosts(0);
  }

  handleTouchTap = () => {
    this.setState({
      expand: !this.state.expand,
    });
  };

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

    if (!this.props.data.friends_feed && !this.state.feeds.length) {
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
          Friends feed loading ...
        </div>
      );
    }
    else {
      const _feeds = this.getFeeds();
      const hiddenPostsCount = this.props.data.hidden_posts_count ? this.props.data.hidden_posts_count.count : 0;

      if (_feeds.length > 0) {
        // Cache friends feed data, disabled temp
        if (localStorage.getItem('mbubblz_activeCache')) {
          const activeCacheObject = JSON.parse(localStorage.getItem('mbubblz_activeCache'));
          activeCacheObject.friendsFeed = false;
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
                onTouchTap={this.refetchFriendsFeed}
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
                      feed_location='friends_feed'
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
                Friends have no notes yet
              </div>
            </div>
          </div>
        );
      }
    }
  }
}

export default withApollo(hoc(FriendsFeed));
