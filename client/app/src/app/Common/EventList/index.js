 /* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';

import EventListItem from '@common/EventListItem';
import Event from '@common/Event';
import hoc from './hoc';

class EventList extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      events: [],
      openEventDialog: false,
    };

    this.subscribedToPusher = false;
  }

  subscribeToPusherChannel = () => {
    const { loading, currentUser } = this.props.data;
    if (loading || !currentUser || this.subscribedToPusher) {
      return;
    }
    this.subscribedToPusher = true;
    const pusher = this.context.pusher;
    let channel = pusher.channels.channels[`private-event-owner-${currentUser.id}`];
    if (!channel) {
      channel = pusher.subscribe(`private-event-owner-${currentUser.id}`);
    }
    channel.bind('event_created', this.refresh);
  }

  unsubscribeFromPusherChannel = () => {
    const pusher = this.context.pusher;
    const { loading, currentUser } = this.props.data;
    if (currentUser) {
      const channel = pusher.channels.channels[`private-event-owner-${currentUser.id}`];
      if (channel) {
        channel.unbind('event_created', this.refresh);
      }
    }
    this.subscribedToPusher = false;
  }

  refresh = () => {
    this.props.data.refetch();
  }

  handleEventClick = (event) => {
    this.setState({
      openEventDialog: true,
      currentEvent: event,
    });
  }

  handleDialogClose = () => {
    this.setState({
      openEventDialog: false,
    });
  }

  componentDidUpdate() {
    this.subscribeToPusherChannel();
  }

  componentWillUnmount() {
    this.unsubscribeFromPusherChannel();
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

    const { myEvents } = this.props.data;

    if (!myEvents) {
      return <div />;
    }

    const containerStyle = {
      padding: '12px 0',
    };

    const events = myEvents.edges;
    const eventsCount = events.length;
    const { openEventDialog, currentEvent } = this.state;

    return (
      <div style={{ ...containerStyle, height: this.props.messagesContainerHeight - 144 }}>
        <div className='events-wrapper'>
          { events.length > 0 ?
            events.map((event, i) => (
              <EventListItem
                key={i}
                event={event.node}
                last={!(i < eventsCount - 1)}
                buttons={[
                  <RaisedButton
                    className='view-button'
                    color='#ffffff'
                    hoverColor='#62db95'
                    label='View'
                    labelStyle={{ textTransform: 'none', color: '#62db95' }}
                    style={{ boxShadow: 'none', border: '2px solid #62db95', borderRadius: '4px' }}
                    onClick={this.handleEventClick.bind(this, event.node)}
                  />,
                ]} />
            ))
            :
            <div style={{ textAlign: 'center', color: '#a0a0a0', padding: 16 }}>No events this week</div>
          }
        </div>
        <Dialog
          modal={false}
          open={openEventDialog}
          onRequestClose={this.handleDialogClose}
          autoScrollBodyContent
          bodyStyle={{ padding: 0 }}
          >
          <Event event={currentEvent} />
        </Dialog>
      </div>
    );
  }

}

export default hoc(EventList);
