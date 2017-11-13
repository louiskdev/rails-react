/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Link } from 'react-router';
import gql from 'graphql-tag';
import { notify } from 'react-notify-toast';
import cookie from 'react-cookie';
import update from 'react-addons-update';
import IconButton from 'material-ui/IconButton';
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more';
import IconNavigationClose from 'material-ui/svg-icons/navigation/close';
import transitions from 'material-ui/styles/transitions';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';

import CreateNote from '@dashboard/components/CreateNote';
import CreateFirstNote from '@dashboard/components/CreateFirstNote';
import FeedItem from '@common/FeedItem';
import { feedItemResult } from '@utils/queryHelpers';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class MyFeed extends Component {

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
      sort_by: '',
      privacy: '',
      expand: false,
      openTopBanner: !cookie.load('updateBannerClosed'),
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    this.listenPusher();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    this.unlistenPusher();
  }

  handleCloseTopBanner = () => {
    cookie.save('updateBannerClosed', true, { path: '/' });
    this.setState({
      openTopBanner: false,
    });
  }

  listenPusher = () => {
    const pusher = this.context.pusher;
    const channel = this.context.globalChannel;
    channel.bind('rating_changed', this.onRatingChanged);

    const currentUser = JSON.parse(localStorage.getItem('mbubblz_user'));
    let dashChannel = pusher.channels.channels[`private-dashboard-${currentUser.id}`];
    if (!dashChannel) {
      dashChannel = pusher.subscribe(`private-dashboard-${currentUser.id}`);
    }
    dashChannel.bind('feed_item_added', this.onFeedItemAdded);
    dashChannel.bind('note_removed', this.onFeedItemRemoved);
    dashChannel.bind('post_removed', this.onFeedItemRemoved);
    dashChannel.bind('activity_removed', this.handleActivityRemoved);
    dashChannel.bind('activity_undo_hidden', this.handleActivityUndoHidden);
  }

  unlistenPusher = () => {
    const pusher = this.context.pusher;
    const channel = this.context.globalChannel;
    channel.unbind('rating_changed', this.onRatingChanged);

    const currentUser = JSON.parse(localStorage.getItem('mbubblz_user'));
    const dashChannel = pusher.channels.channels[`private-dashboard-${currentUser.id}`];
    if (dashChannel) {
      dashChannel.unbind('feed_item_added', this.onFeedItemAdded);
      dashChannel.unbind('note_removed', this.onFeedItemRemoved);
      dashChannel.unbind('post_removed', this.onFeedItemRemoved);
      dashChannel.unbind('activity_removed', this.handleActivityRemoved);
      dashChannel.unbind('activity_undo_hidden', this.handleActivityUndoHidden);
      // pusher.unsubscribe("private-dashboard-" + currentUser.id);
    }
  }

  handleActivityRemoved = (data) => {
    const feeds = this.getFeeds();
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

  onFeedItemAdded = (data) => {
    if (data.feed[0].object_type !== 'Note') {
      this.props.data.refetch();
    }
  }

  onFeedItemRemoved = (data) => {
    const self = this;
    const postData = data.note_data ? data.note_data : data.post_data;
    const activityIds = postData.activity_ids ? postData.activity_ids : [];
    const _feedsInit = this.getFeeds();
    const feeds = JSON.parse(JSON.stringify(_feedsInit));

    for (let i = 0; i < feeds.length; i++) {
      if (activityIds.includes(parseInt(feeds[i].node.id))) {
        feeds.splice(i, 1);
      }
    }
    self.setState({
      feeds,
    });
  }

  refresh = () => {
    this.setState({
      feeds: [],
    }); // / this part may need more careful merge..
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

  updateWithNewNote = (data) => {
    const newFeedItem = {
      __typename: 'ActivityEdge',
      cursor: null,
      node: data.createNote.activity,
    };

    const _feeds = this.getFeeds();

    const newFeed = update([newFeedItem], { $push: _feeds });
    this.setState({
      feeds: newFeed,
    });
  }

  handleFilterChange = (filter) => {
    this.handleReloadFeed(filter, this.state.sort_by);
  }

  handleSortChange = (sortBy) => {
    this.handleReloadFeed(this.state.privacy, sortBy);
  }

  handleReloadFeed = (privacy, sortBy) => {
    const self = this;
    this.setState({
      privacy,
      sort_by: sortBy,
      feeds: [],
    });
    setTimeout(() => {
      this.props.data.refetch({ privacy: privacy, sort_by: sortBy });
    }, 0);
  }

  handleInfiniteLoad = () => {
    const _feedsInit = this.getFeeds();
    let _feeds = JSON.parse(JSON.stringify(_feedsInit));

    if (!_feeds.length) {
      _feeds = this.props.data.my_feed ? this.props.data.my_feed.edges : [];
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
      query getMyFeed($privacy: String!, $sort_by: String!, $lastCursor: String!) {
        my_feed(first: 10, privacy: $privacy, sort_by: $sort_by, before: $lastCursor) {
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
        sort_by: this.state.sort_by || '',
        privacy: this.state.privacy || '',
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
        if (data.my_feed) {
          data.my_feed.edges.forEach((feed) => {
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
      const { my_feed } = this.props.data;
      const newFeed = my_feed && my_feed.edges.length > 0 ? my_feed.edges : []
      return newFeed;
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

  updateNoteAndEndEditing = (index, vars) => {
    const _feedsInit = this.getFeeds();
    if (_feedsInit[index]) {
      const _feeds = JSON.parse(JSON.stringify(_feedsInit));
      if (_feeds[index].node.o_note) {
        _feeds[index].node.o_note.text = vars.text;
        if (vars.link_url) {
          const linkPreview = {
            description: vars.link_description || '',
            picture_url: vars.link_picture_url || '',
            title: vars.link_title || '',
            url: vars.link_url,
          };
          _feeds[index].node.o_note.link_preview = linkPreview;
        }
        else {
          _feeds[index].node.o_note.link_preview = null;
        }
        _feeds[index].node.o_note.editingText = false;
      }
      else if (_feeds[index].node.o_post) {
        _feeds[index].node.o_post.text = vars.text;
        if (vars.link_url) {
          const linkPreview = {
            description: vars.link_description || '',
            picture_url: vars.link_picture_url || '',
            title: vars.link_title || '',
            url: vars.link_url,
          };
          _feeds[index].node.o_post.link_preview = linkPreview;
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

  undoHidden = () => {
    this.props.undoHiddenActivity();
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

    if (!this.props.data.my_feed && !this.state.feeds.length) {
      return (
        <div className='myb-feeds'>
          <div className='myb-feeds-wrapper'>
            <CreateNote updateFeed={this.updateWithNewNote} />

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
          </div>
          My feed loading ...
        </div>
      );
    }
    else {
      const _feeds = this.getFeeds();
      const hiddenPostsCount = this.props.data.hidden_posts_count.count;

      if (_feeds.length > 0) {
        if (localStorage.getItem('mbubblz_activeCache')) {
          const activeCacheObject = JSON.parse(localStorage.getItem('mbubblz_activeCache'));
          activeCacheObject.myFeed = false;
          localStorage.setItem('mbubblz_activeCache', JSON.stringify(activeCacheObject));
        }

        return (
          <div className='myb-feeds'>
            <div className='myb-feeds-wrapper'>
              <CreateNote updateFeed={this.updateWithNewNote} />

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

              {
                this.state.openTopBanner &&
                <div className='top-banner-info'>
                  <span className='top-banner-text'>
                    We have made some updates to our <strong>BETA</strong> platform. <Link to='/news_and_updates' onClick={this.handleClickShowUpdates}>Show me.</Link>
                  </span>
                  <div className='top-banner-close'>
                    <a href='javascript:;' onClick={this.handleCloseTopBanner}>
                      <IconNavigationClose color='#fff' style={{ width: 14, height: 14, margin: '5px 0 0 0' }} />
                    </a>
                  </div>
                </div>
              }

              {_feeds.map((feed, index) => {
                if (feed.node) {
                  const randValue = this.state.updatedIndex === index ? Math.random() * 1000 : 0;
                  return (
                    <FeedItem
                      key={index}
                      index={index}
                      randProp={randValue}
                      feednode={feed.node}
                      feed_location='my_feed'
                      editable
                      updateFeedStatus={this.updateFeedStatus}
                      updateNoteAndEndEditing={this.updateNoteAndEndEditing}
                      enableReply={this.enableReply}
                    />
                  );
                }
              })}
            </div>
          </div>
        );

      }
      else if (_feeds.length === 0 && (this.state.sort_by !== '' || this.state.privacy !== '')) {
        return (
          <div className='myb-feeds'>
            <div className='myb-feeds-wrapper'>
              <CreateNote updateFeed={this.updateWithNewNote} />
              <div className='filter-sort-block'>
                <div className='filters'>
                  <a className={this.state.sort_by === '' ? 'active' : ''} onClick={this.handleSortChange.bind(this, '')}>Newest</a>
                  <a className={this.state.sort_by === 'rating' ? 'active' : ''} onClick={this.handleSortChange.bind(this, 'rating')}>Popular</a>
                  {/* }<a className={this.state.sort_by === 'favourite' ? 'active' : ''} onClick={this.handleSortChange.bind(this, 'favourite')}>Favorite</a>*/}
                  <a className='inactive'>Favorite</a>
                  <div className='sort'>
                    <a className={this.state.privacy === '' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, '')}>All</a>
                    <a className={this.state.privacy === 'public' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, 'public')}>Public</a>
                    <a className={this.state.privacy === 'private' ? 'active' : ''} onClick={this.handleFilterChange.bind(this, 'private')}>Private</a>
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
          <CreateFirstNote updateFeed={this.updateWithNewNote} />
        );
      }
    }
  }
}

MyFeed.propTypes = {
  mutate: React.PropTypes.func,
  mutations: React.PropTypes.object,
  query: React.PropTypes.func,
  data: React.PropTypes.object,
};

export default withApollo(hoc(MyFeed));
