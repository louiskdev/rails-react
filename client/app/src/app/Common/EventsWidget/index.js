/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import gql from 'graphql-tag';
import { notify } from 'react-notify-toast';
import Dialog from 'material-ui/Dialog';
import ReactGA from 'react-ga';
import IconButton from 'material-ui/IconButton';
import IconLeftArrow from 'material-ui/svg-icons/hardware/keyboard-arrow-left';
import IconRightArrow from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import DatePickerDialog from 'material-ui/DatePicker/DatePickerDialog';

import EventsWidgetList from '@common/EventsWidgetList';
import EventsWidgetCalendar from '@common/EventsWidgetCalendar';
import CreateEvent from '@common/CreateEvent';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class EventsWidget extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);

    this.state = {
      loading: true,
      events: null,
      openCreateEvent: false,
      openEventDialog: false,
      startDate,
      openDatePickerDialog: false,
      viewmode: 'list',
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
    if (this.state.loading) {
      return;
    }
    const { events } = this.state;
    const eventsCopy = JSON.parse(JSON.stringify(events));
    data.joined = true;
    eventsCopy.splice(0, 0, {
      node: data,
    });
    this.setState({
      events: eventsCopy,
    });
  }

  prevWeek = () => {
    const { startDate } = this.state;
    startDate.setDate(startDate.getDate() - 7);
    this.loadEvents(startDate);
  }

  nextWeek = () => {
    const { startDate } = this.state;
    startDate.setDate(startDate.getDate() + 7);
    this.loadEvents(startDate);
  };

  onDateClick = () => {
    this.refs.datePickerDialog.show();
  };

  onSelectDate = (date) => {
    const startDate = date;
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
    this.loadEvents(startDate);
  };

  handleDialogClose = () => {
    this.setState({
      openCreateEvent: false,
    });
  }

  handleJoinEvent = (event_id) => {
    this.props.joinEvent({ variables: { event_id: parseInt(event_id) } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        notify.show(errors[0].message, 'error');
      }
      else {
        const { events } = this.state;
        for (let i = 0; i < events.length; i++) {
          if (events[i].node.id === event_id) {
            events[i].node.joined = true;
            break;
          }
        }
        this.setState({
          events,
        });
        ReactGA.event({
          category: 'Event',
          action: 'Joined an event',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  handleDisjoinEvent = (event_id) => {
    this.props.disjoinEvent({ variables: { event_id: parseInt(event_id) } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        notify.show(errors[0].message, 'error');
      }
      else {
        const { events } = this.state;
        for (let i = 0; i < events.length; i++) {
          if (events[i].node.id === event_id) {
            events[i].node.joined = false;
            break;
          }
        }
        this.setState({
          events,
        });
        ReactGA.event({
          category: 'Event',
          action: 'Disjoined an event',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  loadEvents = (startDate) => {
    const { eventsWidgetId } = this.props;
    const endDate = new Date(startDate.getTime());
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    endDate.setMilliseconds(0);

    this.setState({
      startDate,
      loading: true,
    });

    this.props.client.query({
      query: gql`
        query getEventsWidgetData($id: Int!, $start_date: String, $end_date: String) {
          eventsFromWidget(events_widget_id: $id, start_date: $start_date, end_date: $end_date) {
            edges {
              node {
                id
                name
                permalink
                avatar_url(version: "micro")
                type
                likes_count
                members_count
                start_date
                address
                description
                joined
                owned
                members {
                  edges {
                    node {
                      id
                      username
                      avatar_url(version: "micro")
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        id: eventsWidgetId,
        start_date: startDate,
        end_date: endDate,
      },
      forceFetch: true,
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
        this.setState({
          loading: false,
        });
      }
      else {
        this.setState({
          loading: false,
          events: data.eventsFromWidget.edges,
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
      this.setState({
        loading: false,
      });
    });
  }

  formatDateTime = (date) => {
    const _date = new Date(date);
    const month = _date.getMonth() + 1;
    let dstr = '';
    dstr = dstr + _date.getFullYear() + '-';
    dstr = dstr + (month < 10 ? '0' : '') + month + '-';
    dstr = dstr + (_date.getDate() < 10 ? '0' : '') + _date.getDate() + ' ';
    const h = _date.getHours() % 12;
    dstr = dstr + (h < 10 ? '0' : '') + h + ':00 ';
    dstr = dstr + _date.getHours() < 12 ? 'AM' : 'PM';
    return dstr;
  }

  handleSelectListView = () => {
    this.setState({
      viewmode: 'list',
    });
  }

  handleSelectCalendarView = () => {
    this.setState({
      viewmode: 'calendar',
    });
  }

  componentDidMount() {
    this.loadEvents(this.state.startDate);
  }

  componentDidUpdate() {
    this.subscribeToPusherChannel();
  }

  componentWillUnmount() {
    this.unsubscribeFromPusherChannel();
  }

  render() {
    const { events } = this.state;
    if (!events) {
      return (
        <div>
          Loading events widget...
        </div>
      );
    }

    const { containerStyle, rightButtonStyle } = CommonStyles.widget;

    // const topbarStyle = {
    //   position: 'absolute',
    //   left: 0,
    //   top: 0,
    //   right: 0,
    //   padding: '10px 25px',
    //   background: '#fbfbfb',
    // };

    const subheaderStyles = {
      fontSize: 13,
      borderBottom: '1px solid #f1f1f1',
      borderTop: '1px solid #f1f1f1',
      lineHeight: '42px',
      marginTop: '-8px',
      display: 'flex',
      alignitems: 'center',
      justifyContent: 'space-between',
      textTransform: 'uppercase',
    };

    const headerStyle = {
      padding: 5,
      textAlign: 'center',
    };
    const dayNavBtnStyle = {
      verticalAlign: 'middle',
    };
    const dateContainerStyle = {
      display: 'inline-block',
      verticalAlign: 'middle',
      lineHeight: 1.3,
      cursor: 'pointer',
    };
    const yearStyle = {
      fontSize: '0.75em',
      opacity: 0.7,
    };

    const { bubbleId } = this.props;
    const { startDate, openDatePickerDialog, viewmode } = this.state;
    const endDate = new Date(startDate.getTime());
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    endDate.setMilliseconds(0);

    return (
      <div style={containerStyle}>
        <div className='topbar-filters filter-sort-block' >
          <div className='filters'>
            {/* <a href="javascript:;" className="active">All events</a>
            <a href="javascript:;">My events</a>*/}
            <a className={viewmode == 'list' ? 'active' : ''} href='javascript:;' onClick={this.handleSelectListView}>List View</a>
            <a className={viewmode == 'calendar' ? 'active' : ''} href='javascript:;' onClick={this.handleSelectCalendarView}>Calendar View</a>
            <a href='javascript:;' style={rightButtonStyle}
              onClick={() => this.setState({ openCreateEvent: true })}
              >Create a new event</a>
          </div>
        </div>
        <div style={headerStyle}>
          <IconButton style={dayNavBtnStyle} onClick={this.prevWeek}>
            <IconLeftArrow />
          </IconButton>
          <span style={dateContainerStyle} onClick={this.onDateClick}>
            <span style={yearStyle}>2016</span><br />
            <span>
              {this.months[startDate.getMonth()]} {startDate.getDate()}
            </span>
            <span> - </span>
            <span>
              {this.months[endDate.getMonth()]} {endDate.getDate()}
            </span>
          </span>
          <IconButton style={dayNavBtnStyle} onClick={this.nextWeek}>
            <IconRightArrow />
          </IconButton>
        </div>
        {
          viewmode === 'list' ?
          <EventsWidgetList
            events={events}
            handleJoinEvent={this.handleJoinEvent}
            handleDisjoinEvent={this.handleDisjoinEvent} />
          :
          <EventsWidgetCalendar
            events={events}
            startDate={startDate} />
        }
        <Dialog
          title='Create Event'
          modal={false}
          open={this.state.openCreateEvent}
          onRequestClose={this.handleDialogClose}
          autoScrollBodyContent
          contentStyle={CommonStyles.dialog.content}
          bodyStyle={CommonStyles.dialog.body}
          titleStyle={CommonStyles.dialog.title}
          style={{ zIndex: 0, padding: 0 }}
        >
          <CreateEvent bubbleId={bubbleId} onRequestClose={this.handleDialogClose} />
        </Dialog>
        <DatePickerDialog
          autoOk
          container='dialog'
          mode='portrait'
          firstDayOfWeek={0}
          ref='datePickerDialog'
          onAccept={this.onSelectDate} />
      </div>
    );
  }

}

export default withApollo(hoc(EventsWidget));
