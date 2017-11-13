/* @flow */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import ReactGA from 'react-ga';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import Badge from 'material-ui/Badge';
import Avatar from 'material-ui/Avatar';
import IconLock from 'material-ui/svg-icons/action/lock';
import IconSocialPeople from 'material-ui/svg-icons/social/people';
import IconActionFavorite from 'material-ui/svg-icons/action/favorite';
import IconSocialGroupRemove from 'material-ui/svg-icons/content/remove-circle';
import IconActionDelete from 'material-ui/svg-icons/action/delete';
import { List } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import CommonStyles from '@utils/CommonStyles';

import hoc from './hoc';

class MyBubbles extends Component {
  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = {
      openBubbleDeleteDialog: false,
      bubble_id: null,
      bubbleCounters: {},
    };
  }

  componentWillMount = () => {
    this.subscribeToDashboardChannel();
  }

  componentWillUnmount = () => {
    this.unsubscribeFromDashboardChannel();
  }

  subscribeToDashboardChannel = () => {
    const self = this;
    const pusher = this.context.pusher;
    const currentUser = JSON.parse(localStorage.getItem('mbubblz_user'));
    let channel = pusher.channels.channels[`private-dashboard-${currentUser.id}`];
    this.setState({
      currentUserId: currentUser.id,
    });
    if (!channel) {
      channel = pusher.subscribe(`private-dashboard-${currentUser.id}`);
    }

    channel.bind('total_unread_items_count_changed', (data) => {
      const bubbleCounters = self.state.bubbleCounters;
      bubbleCounters[data.bubble.id] = data.total_unread_items_count;
      self.setState({ bubbleCounters });
    });
  }

  unsubscribeFromDashboardChannel = () => {
    const pusher = this.context.pusher;
    let currentUserId = this.state.currentUserId;
    if (localStorage.getItem('mbubblz_user')) {
      currentUserId = JSON.parse(localStorage.getItem('mbubblz_user')).id;
    }
    const channel = pusher.channels.channels[`private-dashboard-${currentUserId}`];
    if (channel) {
      channel.unbind('total_unread_items_count_changed');
      // pusher.unsubscribe("private-dashboard-" + currentUserId);
    }
  }

  disjoinBubble = (bubble_id) => {
    const self = this;
    this.props.disjoinBubble(
      { variables: { bubble_id: parseInt(bubble_id, 10) } }
    ).then((graphQLResult) => {
      const { errors } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        notify.show('You left bubble successfully!', 'success', 2000);
        self.props.data.refetch();

        ReactGA.event({
          category: 'Bubble',
          action: 'Disjoined a bubble',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  deleteBubble = () => {
    const bubble_id = this.state.bubble_id;
    const self = this;

    this.handleCloseBubbleDeleteDialog();
    if (!bubble_id) {
      return;
    }
    this.props.deleteBubble({ variables: { id: parseInt(bubble_id, 10) } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;

      this.handleCloseBubbleDeleteDialog();

      if (errors) {
        notify.show(errors[0].message, 'error');
      }
      else {
        notify.show('Bubble deleted successfully!', 'success', 3000);
        self.props.data.refetch();
        ReactGA.event({
          category: 'Bubble',
          action: 'Deleted a bubble',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  openDeleteDialog = (e, bubble_id) => {
    e.preventDefault();
    this.setState({
      openBubbleDeleteDialog: true,
      bubble_id: bubble_id,
    });
  }

  handleCloseBubbleDeleteDialog = () => {
    this.setState({
      openBubbleDeleteDialog: false,
      bubble_id: null,
    });
  }

  render() {
    if (this.props.data.errors) {
      if (this.props.data.errors.message !== '') {
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
      return (<div>My Bybbles loading ...</div>);
    }

    const bubbles = this.props.data.my_bubbles.edges;

    const bubblesCount = bubbles.length;
    if (!bubblesCount) {
      return (
        <div style={CommonStyles.userBubblz.containerStyle}>
          No bubblz yet
        </div>
      );
    }

    const subheaderStyles = {
      fontSize: 13,
      borderBottom: '1px solid #f1f1f1',
      borderTop: '1px solid #f1f1f1',
      lineHeight: '42px',
      marginBottom: 12,
      display: 'flex',
      alignitems: 'center',
      justifyContent: 'space-between',
      textTransform: 'uppercase',
    };

    return (
      <List className='bubbles-list' style={{ backgroundColor: '#ffffff', overflow: 'auto' }}>
        <Subheader style={subheaderStyles}>Bubbles</Subheader>
        {
          bubbles.length > 0 ?
            (bubbles.map((item, index) => {
              const bubble = item.node;
              const bubbleCounts = this.state.bubbleCounters[bubble.id] ?
                  this.state.bubbleCounters[bubble.id]
                :
                  bubble.total_unread_items_count;
              return (
                <div
                  key={bubble.id}
                  className='bubbles-item' style={{ padding: '0 12px', margin: '20px 0 0 0', float: 'left', minHeight: 240, width: '33%', textAlign: 'center' }}>

                  <div style={{ left: 0 }}>
                    <Link to={`/bubbles/${bubble.permalink}`}>
                      <Avatar
                        src={bubble.avatar_url}
                        size={56}
                      />
                    </Link>
                    {
                      bubbleCounts > 0 ?
                        <span className='bubble-counter'>
                          <Badge
                            badgeContent={bubbleCounts > 9 ? '10+' : bubbleCounts}
                            badgeStyle={{
                              top: 6,
                              right: 0,
                              width: 16,
                              height: 16,
                              fontSize: 8,
                              fontWeight: 400,
                              backgroundColor: (bubbleCounts ? '#D97575' : 'transparent'),
                              color: '#FFFFFF',
                            }}
                            style={{ padding: 0 }}
                          />
                        </span>
                      :
                        null
                    }
                  </div>

                  {
                    bubble.type === 'privy' ?
                      <span style={{ margin: '12px 0', display: 'block', height: '17px', overflow: 'hidden' }}>{bubble.name} <IconLock style={{ top: 8, width: 16, height: 16, color: '#bdbdbd' }} /></span>
                    :
                      <span style={{ margin: '12px 0', display: 'block', height: '17px', overflow: 'hidden' }}>{bubble.name}</span>
                  }

                  <div>
                    <IconSocialPeople color={CommonStyles.userBubblz.grayColor} style={{ ...CommonStyles.userBubblz.iconStyle, marginRight: 5 }} />
                    <span style={CommonStyles.userBubblz.statStyle}>{bubble.members_count}</span>
                    <IconActionFavorite color={CommonStyles.userBubblz.grayColor} style={{ ...CommonStyles.userBubblz.iconStyle, marginLeft: 10, marginRight: 5 }} />
                    <span style={CommonStyles.userBubblz.statStyle}>{bubble.members_count}</span>
                  </div>

                <div className='bubble-actions' style={{ height: 40, top: 0, margin: '20px auto' }}>

                  <Link to={`/bubbles/${bubble.permalink}`} style={{ top: '12px', right: '0px' }}>
                    <RaisedButton
                      className='view-button'
                      color='#ffffff'
                      hoverColor='#62db95'
                      label='View'
                      labelStyle={{ textTransform: 'none', color: '#62db95' }}
                      style={{ boxShadow: 'none', border: '2px solid #62db95', borderRadius: '4px' }}
                    />
                  </Link>
                  &nbsp;
                  {bubble.user_role === 'owner' ?
                    <RaisedButton
                      className='delete-button'
                      color='#ffffff'
                      hoverColor='#D97575'
                      label='Delete'
                      labelStyle={{ textTransform: 'none', color: '#D97575' }}
                      icon={<IconActionDelete style={{ marginLeft: 6 }} />}
                      onClick={(event) => this.openDeleteDialog(event, bubble.id)}
                      style={{ boxShadow: 'none', border: '2px solid #D97575', borderRadius: '4px' }}
                    />
                    :
                    <RaisedButton
                      className='delete-button'
                      color='#ffffff'
                      hoverColor='#D97575'
                      label='Leave'
                      labelStyle={{ textTransform: 'none', color: '#D97575' }}
                      icon={<IconSocialGroupRemove style={{ marginLeft: 6 }} />}
                      onClick={() => this.disjoinBubble(bubble.id)}
                      style={{ boxShadow: 'none', border: '2px solid #D97575', borderRadius: '4px' }}
                    />
                  }
                </div>
              </div>
              );
            }))
          :
            <div className='no-bubbles'>
              You don't have any bubbles yet, join or create one
            </div>
        }
        <Dialog
          title='Delete Bubble Confirmation'
          actions={[
            <FlatButton
              label='Cancel'
              primary
              keyboardFocused
              onTouchTap={this.handleCloseBubbleDeleteDialog}
            />,
            <FlatButton
              label='Delete'
              secondary
              onTouchTap={this.deleteBubble}
            />,
          ]}
          modal={false}
          open={this.state.openBubbleDeleteDialog}
          onRequestClose={this.handleCloseBubbleDeleteDialog}
        >
          Are you really sure you want to delete this bubble?<br />
          <strong>This can not be undone.</strong>
        </Dialog>
      </List>
    );
  }
}

export default hoc(MyBubbles);
