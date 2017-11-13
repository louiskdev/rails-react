import React, { Component, PropTypes as T } from 'react';

class IdleStatusChecker extends Component {

  static contextTypes = {
    privateGlobalChannel: React.PropTypes.object,
  }

  state = {
    idle: false,
  }

  constructor(props) {
    super(props);

    this.idleTimer = null;
  }

  handleOnIdle = () => {
    this.idleTimer = null;
    this.setState({
      idle: true,
    });

    // notify this user becomes idle
    const { privateGlobalChannel } = this.context;
    if(localStorage.getItem('mbubblz_user') === '') {
      return ;
    }
    const userId = JSON.parse(localStorage.getItem('mbubblz_user')).id;
    privateGlobalChannel.trigger('client-user_idle_status_change', {
      idle: true,
      userId,
    });

    if (this.props.onIdle) {
      this.props.onIdle();
    }
  }

  handleOnActive = () => {
    if (!this.state.idle) {
      return;
    }
    this.setState({
      idle: false,
    }, () => {
      // notify this user becomes active
      const { privateGlobalChannel } = this.context;
      const userId = JSON.parse(localStorage.getItem('mbubblz_user')).id;
      privateGlobalChannel.trigger('client-user_idle_status_change', {
        idle: false,
        userId,
      });

      if (this.props.onActive) {
        this.props.onActive();
      }
    });
  }

  handleUserInteractionEvent = () => {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.handleOnActive();
    this.startCheck();
  }

  startCheck = () => {
    this.idleTimer = setTimeout(this.handleOnIdle, 5 * 60 * 1000);
  }

  componentDidMount() {
    window.addEventListener('mousemove', this.handleUserInteractionEvent);
    window.addEventListener('mousedown', this.handleUserInteractionEvent);
    window.addEventListener('keydown', this.handleUserInteractionEvent);
    this.startCheck();
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.handleUserInteractionEvent);
    window.removeEventListener('mousedown', this.handleUserInteractionEvent);
    window.removeEventListener('keydown', this.handleUserInteractionEvent);
  }

  render() {
    return (
      <div />
    );
  }
}

export default IdleStatusChecker;
