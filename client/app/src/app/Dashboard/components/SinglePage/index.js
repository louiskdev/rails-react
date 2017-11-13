/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';

import FeedItem from '@common/FeedItem';

import hoc from './hoc';

class SinglePage extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    globalChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      activity: null,
      updatedIndex: -1,
    };
  }

  componentDidMount() {
    this.listenPusher();
  }

  componentWillUnmount = () => {
    this.unlistenPusher();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.activity_id !== this.props.activity_id) {
      this.setState({
        activity: null,
      });
      this.props.data.refetch();
    }
  }

  listenPusher = () => {
    const channel = this.context.globalChannel;
    channel.bind('rating_changed', (data) => {
      const activity = this.getActivity();
      let feeditem = activity.o_note;
      if (activity.o_post) {
        feeditem = activity.o_post;
      }
      else if (activity.o_medium) {
        feeditem = activity.o_medium;
      }
      if (feeditem && parseInt(feeditem.id, 10) === data.message.object_id) {
        this.updateFeedStatus(0, {
          raters_count: data.message.raters_count,
          rating: data.message.rating,
        });
      }
    });
  }

  unlistenPusher = () => {
    const channel = this.context.globalChannel;
    channel.unbind('global');
  }

  getActivity = () => (
    this.state.activity ? this.state.activity : this.props.data.activity
  )

  updateFeedStatus = (index, values = { }) => {
    const activityInit = this.getActivity();
    if (activityInit) {
      const activity = JSON.parse(JSON.stringify(activityInit));
      for (const key in values) {
        if (activity.o_note) {
          activity.o_note[key] = values[key];
        }
        if (activity.o_medium) {
          activity.o_medium[key] = values[key];
        }
        if (activity.o_post) {
          activity.o_post[key] = values[key];
        }
        if (activity.o_event) {
          activity.o_event[key] = values[key];
        }
      }
      this.setState({
        activity: activity,
        updatedIndex: index,
      });
    }
  }

  removeFeedItem = (index) => {
    // TODO redirect to dashboard
    this.props.router.push('/');
    /* const activity = this.getActivity();
    if (activity) {
      activity.splice(1, 1);
      this.setState({
        activity: activity,
        updatedIndex: index
      });
    }*/
  }

  updateNoteAndEndEditing = (index, vars) => {
    const activityInit = this.getActivity();
    const activity = JSON.parse(JSON.stringify(activityInit));
    if (activity) {
      if (activity.o_note) {
        activity.o_note.text = vars.text;
        if (vars.link_url) {
          const linkPreview = {
            description: vars.link_description || '',
            picture_url: vars.link_picture_url || '',
            title: vars.link_title || '',
            url: vars.link_url,
          };
          activity.o_note.link_preview = linkPreview;
        }
        else {
          activity.o_note.link_preview = null;
        }
        activity.o_note.editingText = false;
      }
      else if (activity.o_post) {
        activity.o_post.text = vars.text;
        if (vars.link_url) {
          const linkPreview = {
            description: vars.link_description || '',
            picture_url: vars.link_picture_url || '',
            title: vars.link_title || '',
            url: vars.link_url,
          };
          activity.o_post.link_preview = linkPreview;
        }
        else {
          activity.o_post.link_preview = null;
        }
        activity.o_post.editingText = false;
      }
      this.setState({
        activity: activity,
        updatedIndex: index,
      });
    }
  }

  enableReply = (feedIndex, commentIndex) => {
    const activityInit = this.getActivity();
    if (activityInit) {
      const activity = JSON.parse(JSON.stringify(activityInit));
      const itemObj = activity.o_note ||
        activity.o_post ||
        activity.o_event ||
        activity.o_album ||
        activity.o_medium;
      if (itemObj.comments && itemObj.comments.edges[commentIndex]) {
        itemObj.comments.edges[commentIndex].node.replyEnabled = true;
        this.setState({
          activity: activity,
          updatedIndex: feedIndex,
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
    if (this.props.data.loading) {
      return (
        <div>
          Feed Item loading...
        </div>
      );
    }
    else {
      const activity = this.getActivity();

      if (!activity) {
        return (
          <div className='myb-activity'>
            <div className='myb-activity-wrapper'>
              <div className='myb-message empty'>
                <div className='message-inner'>
                  Item not found
                </div>
              </div>
            </div>
          </div>
        );
      }

      const randValue = parseInt(this.state.updatedIndex, 10) === 0 ? Math.random() * 1000 : activity.id;

      return (
        <div className='myb-activity'>
          <div className='myb-activity-wrapper'>
            <FeedItem
              index={0}
              randProp={randValue}
              feednode={activity}
              feed_location='activity'
              openComments={this.props.location.query ? this.props.location.query.show_comments : false}
              editable
              ratable
              updateFeedStatus={this.updateFeedStatus}
              updateNoteAndEndEditing={this.updateNoteAndEndEditing}
              removeFeedItem={this.removeFeedItem}
              enableReply={this.enableReply}
              comment_id={this.props.comment_id}
            />
          </div>
        </div>
      );
    }
  }
}

export default hoc(SinglePage);
