/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import { List } from 'material-ui/List';
import IconActionDelete from 'material-ui/svg-icons/action/delete';
import IconSocialGroupAdd from 'material-ui/svg-icons/content/add-circle';

import EventListItem from '@common/EventListItem';
import Event from '@common/Event';
import CommonStyles from '@utils/CommonStyles';

class EventsWidgetList extends Component {

  state = {
    currentEvent: null,
    openEventDialog: false,
  }

  handleEventDialogClose = () => {
    this.setState({
      openEventDialog: false,
    });
  }

  render() {
    const { events, handleJoinEvent, handleDisjoinEvent } = this.props;
    const eventsCount = events.length;

    return (
      <div>
        <List className='bubbles-list' style={{ backgroundColor: '#ffffff' }}>
          {
            eventsCount ?
            events.map((event, index) => {
              return (
                <EventListItem
                  key={event.node.id}
                  event={event.node}
                  last={!index < eventsCount - 1}
                  buttons={[
                    <RaisedButton
                      className='view-button'
                      color='#ffffff'
                      hoverColor='#62db95'
                      label='View'
                      labelStyle={{ textTransform: 'none', color: '#62db95' }}
                      style={{ boxShadow: 'none', border: '2px solid #62db95', borderRadius: '4px' }}
                      onClick={e => this.setState({
                        currentEvent: event.node,
                        openEventDialog: true,
                      })}
                    />,
                    (
                    !event.node.owned ?
                      (
                        event.node.joined ?
                      <RaisedButton
                        className='delete-button'
                        color='#ffffff'
                        hoverColor='#D97575'
                        label='Disjoin'
                        labelStyle={{ textTransform: 'none', color: '#D97575' }}
                        icon={<IconActionDelete style={{ marginLeft: 6 }} />}
                        onClick={e => handleDisjoinEvent(event.node.id)}
                        style={{ boxShadow: 'none', border: '2px solid #D97575', borderRadius: '4px' }}
                      />
                      :
                      <RaisedButton
                        className='view-button'
                        color='#ffffff'
                        hoverColor='#62db95'
                        label='Join'
                        labelStyle={{ textTransform: 'none', color: '#62db95' }}
                        icon={<IconSocialGroupAdd style={{ marginLeft: 6 }} />}
                        onClick={e => handleJoinEvent(event.node.id)}
                        style={{ boxShadow: 'none', border: '2px solid #62db95', borderRadius: '4px' }}
                      />
                      )
                      :
                      ''
                    ),
                  ]} />
              );
            })
            :
            <div style={{ padding: '7px 15px' }}>
              No events yet
            </div>
          }
        </List>
        <Dialog
          modal={false}
          open={this.state.openEventDialog}
          onRequestClose={this.handleEventDialogClose}
          autoScrollBodyContent
          bodyStyle={{ padding: 0 }}
          >
          <Event event={this.state.currentEvent} />
        </Dialog>
      </div>
    );
  }
}

export default EventsWidgetList;
