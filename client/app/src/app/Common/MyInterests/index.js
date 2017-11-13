/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import Interests from '@common/Interests';

import hoc from './hoc';

class MyInterests extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.subscribedToPusher = false;
  }

  addInterest = (addingInterest) => {
    const { currentUser } = this.props.getCurrentUserInfo;
    if (!currentUser) {
      return;
    }
    const interestNames = [];
    currentUser.interests.edges.map((interest) => {
      interestNames.push(interest.node.name);
    });
    interestNames.push(addingInterest);
    return this.props.changeInterests({ variables: { interests: interestNames } })
      .then((graphQLResult) => {
        const { errors } = graphQLResult;
        if (errors) {
          notify.show(errors.message, 'error', 2000);
        }
        else {
          this.props.getCurrentUserInfo.refetch();
        }
      }).catch((error) => {
        notify.show(error.message, 'error', 2000);
      });
  };

  removeInterest = (removingInterest) => {
    const { currentUser } = this.props.getCurrentUserInfo;
    if (!currentUser) {
      return;
    }
    const interestNames = [];
    currentUser.interests.edges.map((interest) => {
      if (interest.node.name !== removingInterest) {
        interestNames.push(interest.node.name);
      }
    });
    return this.props.changeInterests({ variables: { interests: interestNames } })
      .then((graphQLResult) => {
        const { errors } = graphQLResult;
        if (errors) {
          notify.show(errors.message, 'error', 2000);
        }
        else {
          this.props.getCurrentUserInfo.refetch();
        }
      }).catch((error) => {
        notify.show(error.message, 'error', 2000);
      });
  };

  render() {
    const { loading, currentUser } = this.props.getCurrentUserInfo;
    if (!currentUser) {
      return (
        <div></div>
      );
    }
    return (
      <Interests
        changeSearchKeyword={this.props.changeSearchKeyword}
        interests={currentUser.interests.edges}
        addInterest={this.addInterest}
        isAdmin={this.props.isAdmin}
        removeInterest={this.removeInterest}
      />
    );
  }
}

export default hoc(MyInterests);
