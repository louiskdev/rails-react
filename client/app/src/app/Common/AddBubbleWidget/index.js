import React, { Component } from 'react';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import { notify } from 'react-notify-toast';

import IconMessages from 'material-ui/svg-icons/communication/message';
import IconEvents from 'material-ui/svg-icons/notification/event-note';
import IconContentPaste from 'material-ui/svg-icons/content/content-paste';
import IconImagePhotoCamera from 'material-ui/svg-icons/image/photo-camera';
import IconFiles from 'material-ui/svg-icons/editor/attach-file';
import IconCheck from 'material-ui/svg-icons/action/check-circle';

import hoc from './hoc';

class AddBubbleWidget extends Component {

  constructor(props) {
    super(props);

    const tempDataWidgetsSource = [];
    let widgetAvailable = true;
    const { bubble } = props;
    if (!bubble.blog_widget_id) {
      tempDataWidgetsSource.push('Blog');
    }
    if (!bubble.chat_widget_id) {
      tempDataWidgetsSource.push('Chat');
    }
    if (!bubble.gallery_widget_id) {
      tempDataWidgetsSource.push('Gallery');
    }
    if (!bubble.events_widget_id) {
      tempDataWidgetsSource.push('Events');
    }
    if (!bubble.files_widget_id) {
      tempDataWidgetsSource.push('Files');
    }
    if (!tempDataWidgetsSource.length) {
      tempDataWidgetsSource.push('- No more widgets -');
      widgetAvailable = false;
    }

    this.state = {
      widget: '',
      tempDataWidgetsSource,
      widgetAvailable,
      submitting: false,
    };
  }

  handleWidgetChange = (event) => {
    this.setState({
      widget: event.currentTarget.textContent,
    });
  }

  handleAddWidget = () => {
    const { widget } = this.state;
    if (!widget) {
      return;
    }
    this.setState({
      submitting: true,
    });
    this.props.addBubbleWidget({ variables: {
      bubble_id: parseInt(this.props.bubble.id),
      name: widget,
    } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;
      this.setState({
        submitting: false,
      });
      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
      }
      else {
        if (this.props.onRefresh) {
          this.props.onRefresh();
        }
        if (this.props.onRequestClose) {
          this.props.onRequestClose();
        }
      }
    }).catch((error) => {
      this.setState({
        submitting: false,
      });
      notify.show(error.message, 'error');
    });
  }

  render() {
    const addButtonStyle = {
      height: '48px',
      width: this.state.isSmallScreen ? '97%' : '200px',
      textAlign: 'center',
      color: '#FFFFFF',
      textTransform: 'none',
      fontSize: '1.1em',
      padding: 'auto 24px',
    };

    const { tempDataWidgetsSource, widget, widgetAvailable, submitting } = this.state;

    const widgetOptions = [];
    const iconStyle = {
      display: 'block',
      position: 'relative',
      margin: '0 auto',
      left: 'auto',
      width: 40,
      height: 40,
    };

    const checkIconStyle = {
      position: 'absolute',
      right: '40px',
      top: '14px',
      backgroundColor: '#fff',
      zIndex: 10,
      borderRadius: '500px',
    };

    tempDataWidgetsSource.map((widget) => {
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
      widgetOptions.push(
        <MenuItem
          className="widget-item"
          leftIcon={widgetIcon}
          innerDivStyle={{padding: '24px 8px 4px'}}
          key={widget}
          value={widget}
          primaryText={widget}
          onClick={this.handleWidgetChange}
        >
          {this.state.widget === widget ? <IconCheck color='#62db95' style={checkIconStyle}/> : ''}
        </MenuItem>
      );
    });

    return (
      <div className="add-widget-dialog">
        <h3>Widget type</h3>
        <p>Select the type of widget you want to add</p>
        <div className="widgets-list">
          {widgetOptions}
        </div>
        <div style={{ textAlign: 'center' }}>
          <FlatButton
            backgroundColor='#61D894'
            label='Add Widget'
            disabled={!widgetAvailable || submitting}
            style={addButtonStyle}
            onClick={this.handleAddWidget}
          />
        </div>
      </div>
    );
  }
}

export default hoc(AddBubbleWidget);
