/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import InputField from '@common/InputField';

import ReactGA from 'react-ga';

import hoc from './hoc';

class CreateComment extends Component {
  createComment = (vars) => {
    const self = this;
    this.props.itemCommented();

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
        ReactGA.event({
          category: 'Feed',
          action: 'Wrote a comment',
        });

        if (this.props.parent_id) {
          self.props.updateComments(this.props.index, data);
        }
        else {
          self.props.updateComments(data);
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  render() {
    return (
      <InputField
        type='comment'
        rows={1}
        feed_location={this.props.feed_location}
        object_type={this.props.object_type}
        object_id={this.props.object_id}
        parent_id={this.props.parent_id}
        sendByEnter
        submitMessage={this.createComment}
        pickerPosition='up'
      />
    );
  }
}

CreateComment.propTypes = {
  mutations: React.PropTypes.object,
  feed_location: React.PropTypes.string,
  object_type: React.PropTypes.string,
  index: React.PropTypes.number,
  parent_id: React.PropTypes.number,
  object_id: React.PropTypes.number,
  updateComments: React.PropTypes.func,
  itemCommented: React.PropTypes.func,
};

export default hoc(CreateComment);
