/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import IconTimer from 'material-ui/svg-icons/image/timer';
import Dialog from 'material-ui/Dialog';

import Event from '@common/Event';
import hoc from './hoc';

class EventCalendar extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.hours = [];
    for (let i = 0; i < 24; i++) {
      this.hours.push(i);
    }
    this.weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.eventTypeColors = ['#D4F0FD', '#FFF2C3', '#FDE2FE'];

    this.state = {
      events: {},
      currentEvent: {},
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
    channel.bind('event_created', this.onEventCreated);
  }

  unsubscribeFromPusherChannel = () => {
    const pusher = this.context.pusher;
    const { loading, currentUser } = this.props.data;
    const channel = pusher.channels.channels[`private-event-owner-${currentUser.id}`];
    if (channel) {
      channel.unbind('event_created', this.onEventCreated);
    }
    this.subscribedToPusher = false;
  }

  onEventCreated = (data) => {
    const { events } = this.state;
    this.addEventToArray(events, data);
    this.setState({
      events,
    });
  }

  addEventToArray = (events, event) => {
    const { startDate } = this.props;
    const date = new Date(event.start_date);
    const diffDays = Math.floor((date - startDate) / 3600000 / 24);
    const hour = date.getHours();
    const eventsAtTheTime = events[`${diffDays}_${hour}`] ? events[`${diffDays}_${hour}`] : [];
    eventsAtTheTime.push({
      type: 0,
      name: event.name,
      avatar_url: event.avatar_url,
      description: event.description,
      address: event.address,
      permalink: event.permalink,
      members: event.members,
      start_date: event.start_date,
    });
    events[`${diffDays}_${hour}`] = eventsAtTheTime;
  }

  updateState(props, reset = false) {
    const { myEvents, loading } = props.data;
    if (loading || !myEvents) {
      return;
    }
    const events = reset ? {} : this.state.events;
    myEvents.edges.forEach(event => {
      this.addEventToArray(events, event.node);
    });
    this.setState({
      events,
    });
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

  componentWillMount() {
    this.updateState(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.updateState(nextProps, true);
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

    const timerIconStyle = {
      verticalAlign: 'middle',
    };
    const calendarWrapperStyle = {
      overflowX: 'auto',
      overflowY: 'visible',
    };
    const tableStyle = {
      width: '100%',
      tableLayout: 'fixed',
      minWidth: 600,
    };
    const trStyle = {
      borderTop: '1px solid #ECEDEF',
    };
    const tdStyle = {
      padding: '15px 5px',
      textAlign: 'center',
      verticalAlign: 'middle',
      fontWeight: 400,
      fontSize: '0.85em',
    };
    const hourCellStyle = {
      minHeight: 45,
    };
    const tdCellStyle = {
      padding: '4px 2px 2px 4px',
      verticalAlign: 'top',
    };
    const tdBorderStyle = {
      borderLeft: '1px solid #ECEDEF',
      borderBottom: '1px solid #ECEDEF',
    };
    const hourColStyle = {
      width: 45,
    };
    const dayColStyle = {
      width: 'calc(14.285% - 6.43px)',
    };
    const labelCellStyle = {
      color: '#aaaaaa',
    };
    const eventStyle = {
      display: 'table',
      width: '100%',
      minHeight: 41,
      textAlign: 'center',
      color: '#3EAFE7',
      fontSize: '0.85em',
      lineHeight: 1.25,
      borderRadius: 3,
      cursor: 'pointer',
      marginBottom: 3,
    };
    const eventInnerStyle = {
      display: 'table-cell',
      verticalAlign: 'middle',
      padding: 5,
    };

    const today = new Date();
    const { startDate } = this.props;
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startDate.getTime());
      weekDate.setDate(weekDate.getDate() + i);
      weekDates.push(weekDate);
    }

    const { events, openEventDialog, currentEvent } = this.state;

    return (
      <div style={{ ...calendarWrapperStyle, height: this.props.messagesContainerHeight - 144 }}>
        <table style={tableStyle}>
          <thead style={{ borderBottom: '1px solid #ECEDEF' }}>
            <tr style={trStyle}>
              <th style={{ ...tdStyle, ...hourColStyle }} />
              {weekDates.map((weekDate, index) => (
                <th key={index} style={{ ...tdStyle, ...dayColStyle, ...labelCellStyle, borderBottom: '1px solid #ECEDEF' }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{weekDate.getDate()}</div>
                  <div style={{ textTransform: 'uppercase' }}>{this.weekdays[weekDate.getDay()]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {this.hours.map((hour, i) => {
              return (
                <tr style={trStyle} key={i}>
                  <td style={{ ...tdStyle, ...labelCellStyle, ...hourCellStyle }}>{hour % 12} {hour < 12 ? 'am' : 'pm'}</td>
                  {this.weekdays.map((weekday, index) => {
                    const eventIndex = `${index}_${hour}`;
                    const eventsAtTheTime = events[eventIndex];
                    return (
                      <td key={index} style={{ ...tdCellStyle, ...tdBorderStyle }}>
                        {
                          eventsAtTheTime ?
                          eventsAtTheTime.map((event, i) => (
                            <div key={i}
                              style={{ ...eventStyle, background: this.eventTypeColors[event.type] }}
                              onClick={this.handleEventClick.bind(this, event)}>
                              <span style={eventInnerStyle}>
                                {event.name}
                              </span>
                            </div>
                          ))
                          :
                          ''
                        }
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
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

export default hoc(EventCalendar);
