/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import IconButton from 'material-ui/IconButton';
import IconLeftArrow from 'material-ui/svg-icons/hardware/keyboard-arrow-left';
import IconRightArrow from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import DatePickerDialog from 'material-ui/DatePicker/DatePickerDialog';

import EventList from '@common/EventList';
import EventCalendar from '@common/EventCalendar';

class Events extends Component {

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
      messagesContainerHeight: 600,
      startDate,
      openDatePickerDialog: false,
      viewmode: 'list',
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.onWindowResize);
    setTimeout(() => {
      this.onWindowResize();
    }, 10);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
  }

  componentWillReceiveProps(nextProps) {
    this.onWindowResize();
  }

  onWindowResize = () => {
    const msgbox = ReactDOM.findDOMNode(this);
    if (msgbox) {
      const msgboxSize = msgbox.getBoundingClientRect();
      const msgHeight = $(window).width() > 480 ? window.innerHeight - msgboxSize.top : window.innerHeight - msgboxSize.top - 40;
      this.setState({
        messagesContainerHeight: msgHeight,
      });
    }
  }

  prevWeek = () => {
    const { startDate } = this.state;
    startDate.setDate(startDate.getDate() - 7);
    this.setState({
      startDate,
    });
  }

  nextWeek = () => {
    const { startDate } = this.state;
    startDate.setDate(startDate.getDate() + 7);
    this.setState({
      startDate,
    });
  };

  onDateClick = () => {
    this.refs.datePickerDialog.show();
  };

  onSelectDate = (date) => {
    const startDate = date;
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
    this.setState({
      startDate,
    });
  };

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

  render() {

    const calendarBoxStyle = {
      background: '#fff',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
    };
    const headerStyle = {
      padding: '12px 24px 4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    };
    const dayNavBtnStyle = {
      verticalAlign: 'middle',
      width: 40,
      height: 40,
      padding: 6,
    };
    const dateContainerStyle = {
      display: 'inline-block',
      verticalAlign: 'middle',
      lineHeight: 1.3,
      cursor: 'pointer',
      color: '#62db95',
    };
    const yearStyle = {
      fontSize: '0.75em',
      opacity: 0.7,
      color: '#A0A0A0',
    };

    const { startDate, openDatePickerDialog, viewmode } = this.state;
    const endDate = new Date(startDate.getTime());
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    endDate.setMilliseconds(0);

    return (
      <div className='events-page'>
        <div className='topbar-filters filter-sort-block'>
          <div className='filters'>
            <a className={viewmode == 'list' ? 'active' : ''} href='javascript:;' onClick={this.handleSelectListView}>List View</a>
            <a className={viewmode == 'calendar' ? 'active' : ''} href='javascript:;' onClick={this.handleSelectCalendarView}>Calendar View</a>
          </div>
        </div>
        <div style={calendarBoxStyle}>
          <div style={headerStyle}>
            <span style={dateContainerStyle} onClick={this.onDateClick}>
              <span>
                {this.months[startDate.getMonth()]} {startDate.getDate()}, 2016
              </span>
              <span> - </span>
              <span>
                {this.months[endDate.getMonth()]} {endDate.getDate()}, 2016
              </span>
              <div style={yearStyle}>Weekly Calendar</div>
            </span>
            <span>
              <IconButton style={dayNavBtnStyle} onClick={this.prevWeek}>
                <IconLeftArrow />
              </IconButton>
              <IconButton style={dayNavBtnStyle} onClick={this.nextWeek}>
                <IconRightArrow />
              </IconButton>
            </span>
          </div>
          {
            viewmode != 'calendar' ?
            <EventList startDate={startDate} endDate={endDate} messagesContainerHeight={this.state.messagesContainerHeight}/>
            :
            <EventCalendar startDate={startDate} endDate={endDate} messagesContainerHeight={this.state.messagesContainerHeight}/>
          }
          <DatePickerDialog
            autoOk
            container='dialog'
            mode='portrait'
            firstDayOfWeek={0}
            ref='datePickerDialog'
            onAccept={this.onSelectDate} />
        </div>
      </div>
    );
  }

}

export default Events;
