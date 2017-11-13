import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import IconContentRemoveCircle from 'material-ui/svg-icons/content/remove-circle';

import CommonStyles from '@admin/CommonStyles';
import hoc from './hoc';

class MassEmailing extends Component {

  state = {
    subject: '',
    content: '',
  }

  handleSubjectChange = (e, v) => {
    this.setState({
      subject: v,
    });
  }

  handleContentChange = (e, v) => {
    this.setState({
      content: v,
    });
  }

  sendMassEmail = () => {
    const { subject, content } = this.state;
    console.log(subject, content);
    if (!subject || !content) {
      notify.show('One or more fields are empty', 'error', 5000);
      return;
    }
    this.props.sendMassEmail({ variables: { subject: subject, content: content } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 5000);
        }
        else if (errors.message) {
          notify.show(errors.message, 'error', 5000);
        }
      }
      else if (data.sendMassEmail.status) {
        notify.show('Successfully sent', 'success', 5000);
      }
      else {
        notify.show('Unexpected error', 'error', 5000);
      }
    }).catch((error) => {
      notify.show(error.message ? error.message : 'Unexpected error', 'error', 5000);
    });
  }

  render() {
    const { subject, content } = this.state;
    return (
      <div>
        <h2 style={CommonStyles.pageTitleStyle1}>Mass Emailing</h2>
        <div style={CommonStyles.formStyle}>
          <TextField
            value={subject}
            onChange={this.handleSubjectChange}
            floatingLabelText='Subject'
            ref='subject'
            style={CommonStyles.inputFieldStyle} />
          <TextField
            value={content}
            onChange={this.handleContentChange}
            floatingLabelText='Content'
            ref='content'
            multiLine
            rows={2}
            rowsMax={8}
            style={CommonStyles.inputFieldStyle} />
          <div>
            <RaisedButton label='Send' primary style={CommonStyles.submitButtonStyle} onClick={this.sendMassEmail} />
          </div>
        </div>
      </div>
    );
  }

}

export default hoc(MassEmailing);
