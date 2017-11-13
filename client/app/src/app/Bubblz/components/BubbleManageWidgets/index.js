/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';

import IconClose from 'material-ui/svg-icons/navigation/close';
import IconMessages from 'material-ui/svg-icons/communication/message';
import IconEvents from 'material-ui/svg-icons/notification/event-note';
import IconContentPaste from 'material-ui/svg-icons/content/content-paste';
import IconImagePhotoCamera from 'material-ui/svg-icons/image/photo-camera';
import IconFiles from 'material-ui/svg-icons/editor/attach-file';

import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import BubbleManageTopBar from '../BubbleManageTopBar';

import CommonStyles from '@utils/CommonStyles';
import hoc from './hoc';

class BubbleManageWidgets extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
  }

  state = {
    openRemoveWidgetDialog: false,
    widgetToRemove: '',
  }

  openRemoveWidgetDialog = (widget) => {
    this.setState({
      openRemoveWidgetDialog: true,
      widgetToRemove: widget,
    });
  }

  handleCloseRemoveWidgetDialog = () => {
    this.setState({
      openRemoveWidgetDialog: false,
    });
  }

  removeWidget = () => {
    this.setState({
      openRemoveWidgetDialog: false,
    });
    this.props.disableBubbleWidget({ variables: {
      bubble_id: parseInt(this.props.bubble.id),
      name: this.state.widgetToRemove,
    } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
      }
      else if (this.props.onRefresh) {
        this.props.onRefresh();
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  getWidgetsArray = () => {
    const widgets = [];
    const { bubble } = this.props;
    if (!bubble) {
      return widgets;
    }
    if (bubble.blog_widget_id) {
      widgets.push('Blog');
    }
    if (bubble.chat_widget_id) {
      widgets.push('Chat');
    }
    if (bubble.gallery_widget_id) {
      widgets.push('Gallery');
    }
    if (bubble.events_widget_id) {
      widgets.push('Events');
    }
    if (bubble.files_widget_id) {
      widgets.push('Files');
    }
    return widgets;
  }

  render() {
    const { bubble, openAddWidgetDialog } = this.props;
    const widgets = this.getWidgetsArray();

    const widgetAddButtonContainerStyle = {
      marginBottom: 30,
      textAlign: 'center',
    };

    const iconStyle = {
      display: 'block',
      position: 'relative',
      margin: '0 auto',
      left: 'auto',
      width: 40,
      height: 40,
    };

    return (
      <div style={CommonStyles.bubbleManage.containerStyle}>
        <div style={CommonStyles.bubbleManage.topbarStyle}>
          <BubbleManageTopBar openDeleteDialog={this.props.openDeleteDialog} permalink={this.props.bubble.permalink} currentUrl='bubble-manage-widgets' />
        </div>
        <div style={widgetAddButtonContainerStyle}>
          <FlatButton
            backgroundColor='#61D894'
            label='Add Widget'
            labelStyle={{color: '#FFFFFF', fontSize: '1.1em', textTransform: 'none'}}
            style={{width: '200px'}}
            onClick={openAddWidgetDialog}
          />
        </div>
        <div className="widgets-list" style={{justifyContent: 'flex-start'}}>
          { widgets.length > 0 ?
            widgets.map((widget, i) => {
              let widgetIcon = null;
              if (widget === 'Blog') {
                widgetIcon = <IconContentPaste style={iconStyle} />;
              }
              else if (widget === 'Chat') {
                widgetIcon = <IconMessages style={iconStyle} />;
              }
              else if (widget === 'Events') {
                widgetIcon = <IconEvents style={iconStyle} />;
              }
              else if (widget === 'Files') {
                widgetIcon = <IconFiles style={iconStyle} />;
              }
              else if (widget === 'Gallery') {
                widgetIcon = <IconImagePhotoCamera style={iconStyle} />;
              }
              return (
                <MenuItem
                  className="widget-item"
                  leftIcon={widgetIcon}
                  innerDivStyle={{padding: '24px 8px 4px'}}
                  key={i}
                  value={widget}
                  primaryText={widget}
                >
                  <IconClose
                    color='#D97575'
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                    }}
                    onClick={() => this.openRemoveWidgetDialog(widget)}
                  />
                </MenuItem>
              )
            })
            :
            'No widgets here... Add one or more widget to bubble!'
          }
        </div>
        <Dialog
          title='Remove Widget Confirmation'
          actions={[
            <FlatButton
              label='Cancel'
              primary
              keyboardFocused
              onTouchTap={this.handleCloseRemoveWidgetDialog}
            />,
            <FlatButton
              label='Remove'
              secondary
              onTouchTap={this.removeWidget}
            />,
          ]}
          modal={false}
          open={this.state.openRemoveWidgetDialog}
          onRequestClose={this.handleCloseRemoveWidgetDialog}
        >
          Are you really sure you want to remove this widget?
        </Dialog>
      </div>
    );
  }
}

export default hoc(BubbleManageWidgets);
