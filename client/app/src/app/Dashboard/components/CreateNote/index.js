/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import ReactGA from 'react-ga';

import InputField from '@common/InputField';

import hoc from './hoc';

class CreateNote extends Component {
  constructor(props) {
    super(props);
  }

  createNote = (vars) => {
    const self = this;

    this.props.submit({ variables: vars })
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
      else {

        self.props.updateFeed(data);
        // self.props.updateFeed();

        ReactGA.event({
          category: 'Feed',
          action: 'Wrote a note',
        });
      }

    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  render() {
    const self = this;

    return (
      <div className="new-message-box-wrapper">
        <InputField type='note' rows={1} submitMessage={this.createNote} />
      </div>
    );
  }
}

export default hoc(CreateNote);
