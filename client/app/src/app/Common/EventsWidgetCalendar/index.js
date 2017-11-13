/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import Dialog from 'material-ui/Dialog';
import IconTimer from 'material-ui/svg-icons/image/timer';

import Event from '@common/Event';

class EventsWidgetCalendar extends Component {

  constructor(props) {
    super(props);

    this.hours = [];
    for (let i = 0; i < 24; i++) {
      this.hours.push(i);
    }
    this.weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.eventTypeColors = ['#8de3b1', '#65d3e3', '#fcaf9d'];

    this.state = {
      events: {},
      currentEvent: {},
      openEventDialog: false,
    };
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

  updateState(props) {
    const { events } = props;
    const newEvents = {};
    events.forEach(event => {
      this.addEventToArray(newEvents, event.node);
    });
    this.setState({
      events: newEvents,
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

  render() {
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
      borderTop: '1px solid #f2f2f2',
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
      padding: '2px 2px 0',
      verticalAlign: 'top',
    };
    const tdBorderStyle = {
      borderLeft: '1px solid #f2f2f2',
    };
    const hourColStyle = {
      width: 45,
    };
    const dayColStyle = {
      width: 'calc(14.285% - 6.43px)',
      background: '#f6f6f6',
    };
    const labelCellStyle = {
      color: '#aaaaaa',
    };
    const eventStyle = {
      display: 'table',
      width: '100%',
      minHeight: 41,
      textAlign: 'center',
      color: '#fff',
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
      <div style={calendarWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={trStyle}>
              <th style={{ ...tdStyle, ...hourColStyle }}>
                <IconTimer style={timerIconStyle} color='#c3c3c3' />
              </th>
              {weekDates.map((weekDate, index) => (
                <th key={index} style={{ ...tdStyle, ...tdBorderStyle, ...dayColStyle, ...labelCellStyle }}>
                  {this.weekdays[weekDate.getDay()]}, {weekDate.getDate()}
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

export default EventsWidgetCalendar;
