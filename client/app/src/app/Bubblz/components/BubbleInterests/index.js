/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import Interests from '@common/Interests';

import hoc from './hoc';

class BubbleInterests extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  state = {
    interests: [],
  }

  componentDidMount() {
    this.subscribeToPusherChannel();
  }

  componentWillUnmount() {
    this.unsubscribeFromPusherChannel();
  }

  getInterests = () => {
    const { interests } = this.state;
    if (interests && interests.length) {
      return interests;
    }
    else {
      return this.props.interests;
    }
  };

  subscribeToPusherChannel = () => {
    const pusher = this.context.pusher;
    const { bubblePermalink } = this.props;
    let bubbleChannel = pusher.channels.channels['private-bubble-' + bubblePermalink];
    if (!bubbleChannel) {
      bubbleChannel = pusher.subscribe('private-bubble-' + bubblePermalink);
    }

    bubbleChannel.bind('bubble_interests_changed', this.onBubbleInteretsChanged);
  };

  unsubscribeFromPusherChannel = () => {
    const pusher = this.context.pusher;
    const { bubblePermalink } = this.props;

    const bubbleChannel = pusher.channels.channels['private-bubble-' + bubblePermalink];
    if (bubbleChannel) {
      bubbleChannel.unbind('bubble_interests_changed', this.onBubbleInteretsChanged);
      // pusher.unsubscribe('private-bubble-'+bubblePermalink);
    }
  };

  onBubbleInteretsChanged = (data) => {
    const { interests } = data.bubble_data;
    const interestsWithNode = [];
    interests.map(interest => {
      interestsWithNode.push({
        node: {
          name: interest,
        },
      });
    });
    this.setState({
      interests: interestsWithNode,
    });
  }

  addInterest = (addingInterest) => {
    const { bubble_id } = this.props;
    const interests = this.getInterests();
    const interestNames = [];
    if (interests) {
      interests.map((interest, index) => {
        interestNames.push(interest.node.name);
      });
    }
    interestNames.push(addingInterest);
    return this.props.changeInterests({ variables: { bubble_id: parseInt(bubble_id), interests: interestNames } })
      .then((graphQLResult) => {
        const { errors } = graphQLResult;
        if (errors) {
          notify.show(errors.message, 'error', 2000);
        }
        else {
          //this.props.getBubble.refetch();
        }
      }).catch((error) => {
        notify.show(error.message, 'error', 2000);
      });
  };

  removeInterest = (removingInterest) => {
    const { bubble_id, isAdmin } = this.props;
    if (!isAdmin) {
      return;
    }
    const interests = this.getInterests();
    const interestNames = [];
    if (interests) {
      interests.map((interest, index) => {
        if (interest.node.name !== removingInterest) {
          interestNames.push(interest.node.name);
        }
      });
    }
    return this.props.changeInterests({ variables: { bubble_id: parseInt(bubble_id), interests: interestNames } })
      .then((graphQLResult) => {
        const { errors } = graphQLResult;
        if (errors) {
          notify.show(errors.message, 'error', 2000);
        }
        else {
          // this.props.getCurrentUserInfo.refetch();
        }
      }).catch((error) => {
        notify.show(error.message, 'error', 2000);
      });
  };

  render() {
    const interests = this.getInterests();
    return (
      <Interests
        changeSearchKeyword={this.props.changeSearchKeyword}
        isBubble
        interests={interests}
        addInterest={this.addInterest}
        removeInterest={this.removeInterest}
        isAdmin={this.props.isAdmin}
      />
    );
  }
}

export default hoc(BubbleInterests);
