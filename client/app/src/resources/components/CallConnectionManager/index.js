import React, { Component, PropTypes as T } from 'react';
import { notify } from 'react-notify-toast';
import Paper from 'material-ui/Paper';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import IconAVVideocam from 'material-ui/svg-icons/av/videocam';
import IconAVVideocamOff from 'material-ui/svg-icons/av/videocam-off';
import IconAVMic from 'material-ui/svg-icons/av/mic';
import IconAVMicOff from 'material-ui/svg-icons/av/mic-off';
import IconSocialPersonAdd from 'material-ui/svg-icons/social/person-add';
import IconNavigationFullscreen from 'material-ui/svg-icons/navigation/fullscreen';
import IconNavigationFullscreenExit from 'material-ui/svg-icons/navigation/fullscreen-exit';
import IconCommunicationCallEnd from 'material-ui/svg-icons/communication/call-end';

import hoc from './hoc';

const apiKey = document.getElementsByName('opentok-api-key')[0].content;

class CallConnectionManager extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
  }

  static propTypes = {
    registerCallFunctions: T.func,
  }

  constructor(props) {
    super(props);

    this.state = {
      incomingCalls: [],
      outgoingCall: null,
      currentCall: null,
      volume: 100,
      videoMuted: true,
      fullscreen: false,
      acceptRejectDisabled: false,
      friendsListOpen: false,
    };
    this.callingSound = new Audio('/assets/calling.ogg');
    this.callingSound.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
    });
    this.callIncomingSound = new Audio('/assets/callincoming.ogg');
    this.callIncomingSound.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
    });

    const { registerCallFunctions } = this.props;
    if (registerCallFunctions) {
      registerCallFunctions({
        startDirectCall: this.startDirectCall,
        startDirectVideoCall: this.startDirectVideoCall,
        startGroupCall: this.startGroupCall,
      });
    }
  }

  subscribeToPusher = () => {
    const channel = this.context.userChannel;
    if (channel) {
      channel.bind('calling', this.handleIncomingCall);
      channel.bind('call-rejected', this.handleRejectCall);
    }
  }

  unsubscribeFromPusher = () => {
    const channel = this.context.userChannel;
    if (channel) {
      channel.unbind('calling', this.handleIncomingCall);
      channel.unbind('call-rejected', this.handleRejectCall);
    }
  }

  checkIfUserIsOnline = (userId) => {
    const { onlineUsers } = this.props;
    const _onlineUsers = JSON.parse(onlineUsers);
    return !!_onlineUsers[userId];
  }

  handleCloseCall = (session) => {
    const { currentCall, outgoingCall } = this.state;
    if (currentCall && currentCall.session && currentCall.session.id === session.id) {
      this.setState({
        currentCall: null,
      });
    }
    else if (outgoingCall && outgoingCall.session && outgoingCall.session.id === session.id) {
      this.setState({
        outgoingCall: null,
      });
    }
    else {
      this.removeIncomingCall(session.id);
    }
  }

  initSession = (sessionId, token, useVideo, callbacks) => {
    const { onStreamCreated, onStreamDestroyed, onConnected, onDisconnected } = callbacks;
    const session = OT.initSession(apiKey, sessionId);
    // on call stream create
    session.on('streamCreated', function(event) {
      console.log('stream created');
      const options = {
        subscribeToAudio: true,
      };
      if (!useVideo) {
        options.subscribeToVideo = false;
      }
      else {
        options.subscribeToVideo = true;
      }
      if (onStreamCreated) {
        onStreamCreated(session, event, options);
      }
    });
    // on call stream destroy
    session.on('streamDestroyed', function(event) {
      console.log('stream destroyed');
      if (onStreamDestroyed) {
        onStreamDestroyed(session, event);
      }
      setTimeout(() => {
        if (session.connections.length() < 2) {
          session.disconnect();
        }
      }, 500);
    });
    // on call close
    session.on('sessionDisconnected', function(event) {
      console.log('session disconnected');
      if (onDisconnected) {
        onDisconnected(session, event);
      }
    });
    // ---
    // connect to start
    // ---
    session.connect(token, function(error) {
      console.log('session connected');
      if (!error) {
        try {
          const options = {
            publishAudio: true,
            insertMode: 'append',
          };
          if (!useVideo) {
            options.videoSource = null;
            options.publishVideo = false;
          }
          else {
            options.publishVideo = true;
          }
          const publisher = OT.initPublisher('publisher', options);
          session.publish(publisher);
          if (onConnected) {
            onConnected(session, publisher);
          }
        }
        catch (e) {
          console.log('Connection closed');
          onDisconnected(session, e);
        }
      }
      else {
        console.log('There was an error connecting to the session: ', error.code, error.message);
      }
    });
    return session;
  }

  initGroupSession = (sessionId, token, callbacks) => {
    const { onStreamCreated, onStreamDestroyed, onConnected, onDisconnected } = callbacks;
    const session = OT.initSession(apiKey, sessionId);
    // on call stream create
    session.on('streamCreated', function(event) {
      console.log('stream created');
      const options = {
        subscribeToAudio: true,
        subscribeToVideo: true,
      };
      if (onStreamCreated) {
        onStreamCreated(session, event, options);
      }
    });
    // on call stream destroy
    session.on('streamDestroyed', function(event) {
      console.log('stream destroyed');
      if (onStreamDestroyed) {
        onStreamDestroyed(session, event);
      }
    });
    // on call close
    session.on('sessionDisconnected', function(event) {
      console.log('session disconnected');
      if (onDisconnected) {
        onDisconnected(session, event);
      }
    });
    // on call connect
    session.on('sessionConnected', function() {
      console.log('section connected');
      try {
        const options = {
          publishAudio: true,
          publishVideo: false,
          insertMode: 'append',
        };
        const publisher = OT.initPublisher('publisher', options);
        session.publish(publisher);
        if (onConnected) {
          onConnected(session, publisher);
        }
      }
      catch (e) {
        console.log('Connection closed');
        if (onDisconnected) {
          onDisconnected(session, e);
        }
      }
    });
    // ---
    // connect to start
    // ---
    session.connect(token);
    return session;
  }

  createSubscriberDiv = (stream, userData) => {
    const streamDivId = 'user-stream-' + userData.user_id;
    if (!document.getElementById(streamDivId)) {
      // Wrapper
      const div = document.createElement('div');
      div.setAttribute('id', streamDivId);
      div.className = 'subscriber-wrapper';
      // Subscriber div
      const subdiv = document.createElement('div');
      subdiv.setAttribute('id', stream.streamId);
      subdiv.className = 'subscriber';
      div.appendChild(subdiv);
      // Subscriber info div
      const subInfoDiv = document.createElement('div');
      subInfoDiv.className = 'subscriber-info';
      // Username
      const userdiv = document.createElement('div');
      userdiv.className = 'username';
      userdiv.innerHTML = userData.username;
      subInfoDiv.appendChild(userdiv);
      // Avatar
      const userimg = document.createElement('img');
      userimg.src = userData.avatar;
      userimg.className = 'avatar';
      subInfoDiv.appendChild(userimg);
      div.appendChild(subInfoDiv);
      // Add subscriber wrapper into dom
      document.getElementById('group-subscribers').appendChild(div);
      return subdiv;
    }
    else {
      return null;
    }
  }

  startCall = (receiverId, receiverName, receiverAvatar, video) => {
    if (!this.checkIfUserIsOnline(receiverId)) {
      notify.show('This user is offline now and cannot receive call.', 'error');
      return;
    }
    // If there is current open or requesting call, cannot start another
    const { currentCall, outgoingCall } = this.state;
    if (currentCall || outgoingCall) {
      return;
    }
    this.setState({
      outgoingCall: {
        session_id: '',
        token: '',
        user_id: receiverId,
        username: receiverName,
        user_avatar: receiverAvatar,
        video_call: video,
      },
      friendsListOpen: false,
    });

    this.props.requestDirectCall({ variables: { receiver_id: parseInt(receiverId), video_call: video } })
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
        const { status, session_id, token } = data.initiateCall;
        if (!status) {
          notify.show('Unexpected error', 'error');
          return;
        }
        const newSession = this.initSession(session_id, token, video, {
          onStreamCreated: (session, event, options) => {
            const userData = JSON.parse(event.stream.connection.data);
            const subdiv = this.createSubscriberDiv(event.stream, userData);
            if (subdiv) {
              const { currentCall } = this.state;
              const subscriber = session.subscribe(event.stream, subdiv.id, options);
              if (currentCall) {
                const { subscribers, ...otherInfo } = currentCall;
                const _subscribers = subscribers.slice(0);
                _subscribers.push(subscriber);
                this.setState({
                  currentCall: {
                    subscribers: _subscribers,
                    ...otherInfo,
                  },
                });
              }
              else {
                const { outgoingCall } = this.state;
                const subscribers = [];
                subscribers.push(subscriber);
                this.setState({
                  outgoingCall: null,
                  incomingCalls: [],
                  currentCall: {
                    session_id,
                    token,
                    session,
                    subscribers,
                    video_call: outgoingCall.video_call,
                    publisher: outgoingCall.publisher,
                    user_id: outgoingCall.user_id,
                    username: outgoingCall.username,
                    user_avatar: outgoingCall.user_avatar,
                    callStartTime: Math.floor(Date.now() / 1000),
                    callStartCountingTimer: setInterval(this.callTimeCount, 1000),
                  },
                  callTimeHours: 0,
                  callTimeMinutes: 0,
                  callTimeSeconds: 0,
                  volume: 100,
                  videoMuted: false,
                });
              }
            }
          },
          onStreamDestroyed: (session, event) => {
            if (session) {
              const userData = JSON.parse(event.stream.connection.data);
              const streamDivId = 'user-stream-' + userData.user_id;
              const streamDiv = document.getElementById(streamDivId);
              if (streamDiv) {
                streamDiv.parentElement.removeChild(streamDiv);
              }
            }
          },
          onConnected: (session, publisher) => {
            const { outgoingCall } = this.state;
            if (outgoingCall.rejected) {
              session.disconnect();
              this.setState({
                outgoingCall: null,
              });
              return;
            }
            const { session_id, token, ..._outgoingCall } = outgoingCall;
            this.setState({
              outgoingCall: {
                session_id,
                token,
                publisher,
                ..._outgoingCall,
              },
            });
          },
          onDisconnected: (session) => {
            const subs = document.getElementById('group-subscribers');
            while (subs.firstChild) {
              subs.removeChild(subs.firstChild);
            }
            this.handleCloseCall(session);
          },
        });
        const { outgoingCall } = this.state;
        if (outgoingCall.rejected) {
          if (session.connection) {
            session.disconnect();
          }
          this.setState({
            outgoingCall: null,
          });
        }
        else {
          this.setState({
            outgoingCall: {
              session: newSession,
              ...outgoingCall,
            },
          });
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  startDirectCall = (receiverId, receiverName, receiverAvatar) => {
    this.startCall(receiverId, receiverName, receiverAvatar, false);
  }

  startDirectVideoCall = (receiverId, receiverName, receiverAvatar) => {
    this.startCall(receiverId, receiverName, receiverAvatar, true);
  }

  startGroupCall = (channelId, bubbleName, bubbleAvatar) => {
    // If there is current open or requesting call, cannot start another
    const { currentCall, outgoingCall } = this.state;
    if (currentCall || outgoingCall) {
      return;
    }
    this.setState({
      outgoingCall: {
        session_id: '',
        token: '',
        channel_id: channelId,
        bubble_name: bubbleName,
        bubble_avatar: bubbleAvatar,
        video_call: true,
        group_call: true,
      },
    });

    this.props.requestGroupCall({ variables: { channel_id: parseInt(channelId), video_call: true } })
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
        const { status, session_id, token } = data.initiateGroupCall;
        if (!status) {
          notify.show('Unexpected error', 'error');
          return;
        }
        this.initGroupSession(session_id, token, {
          onStreamCreated: (session, event, options) => {
            const userData = JSON.parse(event.stream.connection.data);
            const streamDivId = 'user-stream-' + userData.user_id;
            const subdiv = this.createSubscriberDiv(event.stream, userData);
            if (subdiv) {
              // Subscribe now
              const subscriber = session.subscribe(event.stream, subdiv.id, options);
              subscriber.on('audioLevelUpdated', (event) => {
                let movingAvg = this.audioLevelsMovingAvg[subscriber.streamId] ? this.audioLevelsMovingAvg[subscriber.streamId] : 0;
                if (movingAvg === null || movingAvg <= event.audioLevel) {
                  movingAvg = event.audioLevel;
                } else {
                  movingAvg = 0.7 * movingAvg + 0.3 * event.audioLevel;
                }
                this.audioLevelsMovingAvg[subscriber.streamId] = movingAvg;
                let logLevel = (Math.log(movingAvg) / Math.LN10) / 1.5 + 1;
                logLevel = Math.min(Math.max(logLevel, 0), 1);
                this.audioLevels[subscriber.streamId] = logLevel;
              });
              const { subscribers, ...otherInfo } = this.state.currentCall;
              const _subscribers = subscribers.slice(0);
              _subscribers.push(subscriber);
              this.setState({
                currentCall: {
                  subscribers: _subscribers,
                  ...otherInfo,
                },
              });
            }
          },
          onStreamDestroyed: (session, event) => {
            const userData = JSON.parse(event.stream.connection.data);
            const streamDivId = 'user-stream-' + userData.user_id;
            const streamDiv = document.getElementById(streamDivId);
            if (streamDiv) {
              streamDiv.parentElement.removeChild(streamDiv);
            }
          },
          onConnected: (session, publisher) => {
            const { outgoingCall } = this.state;
            if (!outgoingCall) {
              return;
            }
            this.setState({
              outgoingCall: null,
              incomingCalls: [],
              currentCall: {
                session_id,
                token,
                session,
                group_call: true,
                video_call: outgoingCall.video_call,
                publisher: publisher,
                subscribers: [],
                channel_id: outgoingCall.channel_id,
                bubble_name: outgoingCall.bubble_name,
                bubble_avatar: outgoingCall.bubble_avatar,
                callStartTime: Math.floor(Date.now() / 1000),
                callStartCountingTimer: setInterval(this.callTimeCount, 1000),
              },
              callTimeHours: 0,
              callTimeMinutes: 0,
              callTimeSeconds: 0,
              volume: 100,
              videoMuted: true,
            });
            this.speakerFocusCheckTimer = setInterval(this.checkFocusOnSpeakingSubscriber, 500);
            this.audioLevels = {};
            this.audioLevelsMovingAvg = {};
          },
          onDisconnected: (session, error) => {
            console.log(error);
            if (session) {
              const subs = document.getElementById('group-subscribers');
              while (subs.firstChild) {
                subs.removeChild(subs.firstChild);
              }
              this.handleCloseCall(session);
            }
            if (this.speakerFocusCheckTimer) {
              clearInterval(this.speakerFocusCheckTimer);
            }
            this.audioLevels = {};
            this.audioLevelsMovingAvg = {};
          },
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  handleIncomingCall = (data) => {
    const { session_id, token, caller_id, caller_name, caller_avatar, video_call } = data;
    // If there is current open call, cannot accept incoming
    const { outgoingCall, currentCall } = this.state;
    if (outgoingCall || currentCall) {
      return;
    }
    const { incomingCalls } = this.state;
    incomingCalls.push({
      session_id,
      token,
      user_id: caller_id,
      username: caller_name,
      user_avatar: caller_avatar,
      video_call,
    });
    this.setState({
      incomingCalls,
      acceptRejectDisabled: false,
    });
  }

  handleRejectCall = (data) => {
    const { session_id } = data;
    const { outgoingCall } = this.state;

    this.removeIncomingCall(session_id);

    if (!outgoingCall
      || (outgoingCall.session_id && outgoingCall.session_id !== session_id)
    ) {
      return;
    }
    if (!outgoingCall.session) {
      this.setState({
        outgoingCall: {
          rejected: true,
          ...outgoingCall,
        },
      });
    }
    else {
      const { session } = outgoingCall;
      if (session.connection) {
        session.disconnect();
      }
      else {
        this.setState({
          outgoingCall: null,
        });
      }
    }
  }

  acceptIncomingCall = (incomingCall) => {
    // If there is current open or outgoing call, cannot accept incoming
    const { currentCall, outgoingCall } = this.state;
    if (currentCall || outgoingCall) {
      return;
    }

    this.setState({
      acceptRejectDisabled: true,
      friendsListOpen: false,
    });

    const { session_id, token, video_call } = incomingCall;
    this.initSession(session_id, token, video_call, {
      onStreamCreated: (session, event, options) => {
        console.log('incoming call connected');
        const userData = JSON.parse(event.stream.connection.data);
        const subdiv = this.createSubscriberDiv(event.stream, userData);
        if (subdiv) {
          const { currentCall } = this.state;
          const subscriber = session.subscribe(event.stream, subdiv.id, options);
          if (currentCall) {
            const { subscribers, ...otherInfo } = currentCall;
            const _subscribers = subscribers.slice(0);
            _subscribers.push(subscriber);
            this.setState({
              currentCall: {
                subscribers: _subscribers,
                ...otherInfo,
              },
            });
          }
          else {
            const subscribers = [];
            subscribers.push(subscriber);
            this.setState({
              outgoingCall: null,
              incomingCalls: [],
              currentCall: {
                session_id,
                token,
                session,
                subscribers,
                video_call: video_call,
                publisher: incomingCall.publisher,
                user_id: userData.user_id,
                username: userData.username,
                user_avatar: userData.avatar,
                callStartTime: Math.floor(Date.now() / 1000),
                callStartCountingTimer: setInterval(this.callTimeCount, 1000),
              },
              callTimeHours: 0,
              callTimeMinutes: 0,
              callTimeSeconds: 0,
              volume: 100,
              videoMuted: false,
            });
          }
        }
      },
      onStreamDestroyed: (session, event) => {
        if (session) {
          const userData = JSON.parse(event.stream.connection.data);
          const streamDivId = 'user-stream-' + userData.user_id;
          const streamDiv = document.getElementById(streamDivId);
          if (streamDiv) {
            streamDiv.parentElement.removeChild(streamDiv);
          }
        }
      },
      onConnected: (session, publisher) => {
        incomingCall.publisher = publisher;
      },
      onDisconnected: (session) => {
        console.log('call closed');
        if (session) {
          const subs = document.getElementById('group-subscribers');
          while (subs.firstChild) {
            subs.removeChild(subs.firstChild);
          }
          this.handleCloseCall(session);
        }
      },
    });
  }

  toggleMute = () => {
    const { currentCall, volume } = this.state;
    if (currentCall) {
      const newVolume = volume > 0 ? 0 : 100;
      if (currentCall.publisher) {
        currentCall.publisher.publishAudio(newVolume > 0);
        this.setState({
          volume: newVolume,
        });
      }
    }
  }

  toggleVideoMute = () => {
    const { currentCall, videoMuted } = this.state;
    if (currentCall) {
      if (currentCall.publisher) {
        currentCall.publisher.publishVideo(videoMuted);
        this.setState({
          videoMuted: !videoMuted,
        });
      }
    }
  }

  toggleFullscreen = () => {
    const { currentCall, fullscreen } = this.state;
    if (currentCall) {
      if (fullscreen) {
        let exited = false;
        if (document.exitFullscreen) {
          document.exitFullscreen();
          exited = true;
        }
        else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
          exited = true;
        }
        else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
          exited = true;
        }
        else if (document.msExitFullscreen) {
          document.msExitFullscreen();
          exited = true;
        }
        if (exited) {
          this.setState({
            fullscreen: false,
          });
        }
      }
      else if (this.refs.callWindow.requestFullscreen) {
        this.refs.callWindow.requestFullscreen();
      }
      else if (this.refs.callWindow.webkitRequestFullScreen) {
        this.refs.callWindow.webkitRequestFullScreen();
      }
      else if (this.refs.callWindow.mozRequestFullScreen) {
        this.refs.callWindow.mozRequestFullScreen();
      }
      else if (this.refs.callWindow.msRequestFullscreen) {
        this.refs.callWindow.msRequestFullScreen();
      }
    }
  }

  handleFullscreenChange = () => {
    const fullscreenElement = document.fullscreenElement
      || document.webkitFullscreenElement
      || document.mozFullScreenElement
      || document.msFullscreenElement;
    if (fullscreenElement) {
      this.setState({
        fullscreen: true,
      });
    }
    else if (this.state.fullscreen) {
      this.setState({
        fullscreen: false,
      });
    }
  }

  closeCurrentCall = () => {
    const { currentCall } = this.state;
    if (currentCall && currentCall.session) {
      currentCall.session.unpublish(currentCall.publisher);
      const { subscribers } = currentCall;
      subscribers.forEach(subscriber => {
        try {
          if (subscriber.stream) {
            currentCall.session.unsubscribe(subscriber);
          }
        }
        catch (e) {}
      });
      currentCall.session.disconnect();
      this.handleCloseCall(currentCall.session);
    }
  }

  closeOutgoingCall = () => {
    const { outgoingCall } = this.state;
    if (outgoingCall) {
      if (outgoingCall.session) {
        this.props.rejectCall({ variables: {
          session_id: outgoingCall.session.id,
          caller_id: parseInt(outgoingCall.user_id),
        } });
        if (outgoingCall.session.connection) {
          outgoingCall.session.disconnect();
        }
        else {
          this.setState({
            outgoingCall: null,
          });
        }
      }
      else {
        this.setState({
          outgoingCall: null,
        });
      }
    }
  }

  removeIncomingCall = (session_id) => {
    const { incomingCalls } = this.state;
    incomingCalls.every((_call, i) => {
      if (_call.session_id === session_id) {
        incomingCalls.splice(i, 1);
        this.setState({
          incomingCalls,
        });
        return false;
      }
      return true;
    });
  }

  closeIncomingCall = (call) => {
    const { session_id, user_id } = call;
    if (!user_id) {
      throw new Error('Incoming call doesn\'t have user_id');
    }
    this.props.rejectCall({ variables: {
      session_id: session_id,
      caller_id: parseInt(user_id),
    } });
    this.removeIncomingCall(session_id);
  }

  callTimeCount = () => {
    const { currentCall } = this.state;
    if (!currentCall || !currentCall.callStartTime) {
      return;
    }
    const passedTime = Math.floor(Date.now() / 1000) - currentCall.callStartTime;
    const callTimeHours = Math.floor(passedTime / 3600);
    const callTimeMinutes = Math.floor((passedTime % 3600) / 60);
    const callTimeSeconds = Math.floor(passedTime % 60);
    this.setState({
      callTimeHours,
      callTimeMinutes,
      callTimeSeconds,
    });
  }

  formatDigit(n) {
    if (n >= 10) {
      return n.toString();
    }
    else {
      return '0' + n.toString();
    }
  }

  inviteFriendToCall = () => {
    const friendId = parseInt(this.refs.friendsSelect.value);
    const { currentCall } = this.state;
    if (currentCall && currentCall.session) {
      this.setState({
        friendsListOpen: false,
      });
      this.props.inviteFriendToCall({
        variables: {
          receiver_id: friendId,
          session_id: currentCall.session.id,
          video_call: currentCall.video_call,
        },
      })
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
          const { status } = data.inviteIntoCall;
          if (!status) {
            notify.show('Unexpected error', 'error');
            return;
          }
          notify.show('Friend invited into call', 'success');
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
  }

  toggleOpenFriendsList = () => {
    const { friendsListOpen } = this.state;
    this.setState({
      friendsListOpen: !friendsListOpen,
    });
  }

  checkFocusOnSpeakingSubscriber = () => {
    const { currentCall } = this.state;
    if (!currentCall) {
      return;
    }
    const { subscribers } = currentCall;
    if (!subscribers || !subscribers.length) {
      return;
    }
    let maxAudioLevel = 0, index = -1;
    for(let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
      const audioLevel = this.audioLevels[subscriber.streamId];
      if (audioLevel > maxAudioLevel) {
        maxAudioLevel = audioLevel;
        index = i;
      }
    }
    if (index >= 0) {
      console.log(index);///
      const subs = document.querySelectorAll('.subscriber');
      for(let i = 0; i < subs.length; i++) {
        subs[i].classList.remove('speaking');
      }
      const speakingSub = document.getElementById(subscribers[index].streamId);
      if (speakingSub) {
        speakingSub.classList.add('speaking');
      }
    }
  }

  componentDidMount() {
    this.subscribeToPusher();
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('msfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
  }

  componentWillUnmount() {
    this.unsubscribeFromPusher();
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('msfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
  }

  componentDidUpdate() {
    const { incomingCalls, outgoingCall } = this.state;
    if (outgoingCall) {
      this.callingSound.currentTime = 0;
      if (this.callingSound.paused) {
        this.callingSound.play();
      }
    }
    else {
      this.callingSound.pause();
    }
    if (incomingCalls && incomingCalls.length > 0) {
      this.callIncomingSound.currentTime = 0;
      if (this.callIncomingSound.paused) {
        this.callIncomingSound.play();
      }
    }
    else {
      this.callIncomingSound.pause();
    }
  }

  render() {
    const { currentCall, outgoingCall, incomingCalls } = this.state;
    const { callTimeHours, callTimeMinutes, callTimeSeconds, volume, videoMuted, fullscreen, acceptRejectDisabled, friendsListOpen } = this.state;
    const { currentUser } = this.props.data;
    const callExists = !!(currentCall || outgoingCall || incomingCalls.length);

    const callWindowClass = ['call-window'];
    if (currentCall) {
      if (currentCall.video_call) {
        callWindowClass.push('video-call');
      }
      if (fullscreen) {
        callWindowClass.push('fullscreen');
      }
    }

    const avatar = currentCall ?
      (currentCall.group_call ? currentCall.bubble_avatar : currentCall.user_avatar)
      :
      outgoingCall && (outgoingCall.group_call ? outgoingCall.bubble_avatar : outgoingCall.user_avatar);
    const title = currentCall ?
      (currentCall.group_call ? currentCall.bubble_name : currentCall.username)
      :
      outgoingCall && (outgoingCall.group_call ? outgoingCall.bubble_name : outgoingCall.username);

    const friendsSelectStyle = {
      display: 'block',
      width: 200,
      padding: '5px 7px',
      border: 0,
      borderRadius: 3,
    };
    const inviteButtonStyle = {
      height: 25,
      boxShadow: 'none',
      marginTop: 15,
    };
    const inviteButtonLabelStyle = {
      fontSize: 13,
      fontWeight: 400,
      textTransform: 'none',
    };

    const friends = [];
    if (currentCall && currentCall.session) {
      const currentUsersInCall = [];
      currentCall.session.connections.forEach(connection => {
        try {
          const userData = JSON.parse(connection.data);
          currentUsersInCall.push(userData.user_id);
        } catch(e) {
        }
      });
      currentUser.friends.edges.map(friend => {
        if (currentUsersInCall.indexOf(parseInt(friend.node.id)) == -1) {
          friends.push({
            id: friend.node.id,
            username: friend.node.username,
          });
        }
      });
    }

    return (
      <div className='call-bg' style={{ display: callExists ? 'block' : 'none' }}>
        <div className={callWindowClass.join(' ')} ref='callWindow'>
          <div className='pub-sub-wrapper'>
            <div style={{ display: (currentCall ? 'block' : 'none') }}>
              <div id='publisher' />
              <div id='group-subscribers' />
            </div>
          </div>
          {
            (currentCall || outgoingCall) &&
            <Paper className='call-box call-open'>
              <div className='user-info'>
                <img className='caller-avatar' src={avatar} />
                <h3 style={{ marginTop: 20 }}>{title}</h3>
                <h5 style={{ marginTop: 10 }}>
                  {
                    currentCall ?
                    <span>
                      {this.formatDigit(callTimeHours)}:{this.formatDigit(callTimeMinutes)}:{this.formatDigit(callTimeSeconds)}
                    </span>
                    :
                    (outgoingCall.video_call ? 'Video calling...' : 'Calling...')
                  }
                </h5>
              </div>
              {
                (currentUser && friendsListOpen) &&
                <div className='friends'>
                  <select ref='friendsSelect' style={friendsSelectStyle}>
                    {friends.map(friend => (
                      <option key={friend.id} value={friend.id}>{friend.username}</option>
                    ))}
                  </select>
                  <RaisedButton
                    primary
                    label='Join Call'
                    style={inviteButtonStyle}
                    labelStyle={inviteButtonLabelStyle}
                    onClick={this.inviteFriendToCall}
                    disabled={!friends.length} />
                </div>
              }
              <div className='buttons'>
                {(currentCall && currentCall.video_call) && <a className='button' href='javascript:;' onClick={this.toggleVideoMute}>
                  {
                    !videoMuted ?
                    <IconAVVideocam color='#fff' />
                    :
                    <IconAVVideocamOff color='#fff' />
                  }
                </a>}
                <a className='button' href='javascript:;' onClick={this.toggleMute}>
                  {
                    volume > 0 ?
                    <IconAVMic color='#fff' />
                    :
                    <IconAVMicOff color='#fff' />
                  }
                </a>
                {
                  (currentUser && currentCall && !currentCall.group_call) &&
                  <a className='button' href='javascript:;' onClick={this.toggleOpenFriendsList}>
                    <IconSocialPersonAdd color='#fff' />
                  </a>
                }
                {/*
                  currentCall && <a className='button' href='javascript:;' onClick={this.toggleFullscreen}>
                    {
                      !fullscreen ?
                      <IconNavigationFullscreen color='#fff' />
                      :
                      <IconNavigationFullscreenExit color='#fff' />
                    }
                  </a>
                */}
                <a className='button' href='javascript:;' onClick={currentCall ? this.closeCurrentCall : this.closeOutgoingCall}>
                  <IconCommunicationCallEnd color='#f00' />
                </a>
              </div>
            </Paper>
          }
          {
            incomingCalls.map((incomingCall, i) => (
              <Paper key={i} className='call-box call-incoming'>
                <div className='user-info'>
                  <img className='caller-avatar' src={incomingCall.user_avatar} />
                  <h5 style={{ marginTop: 15 }}>Incoming {incomingCall.video_call ? 'video call' : 'call'} from</h5>
                  <h3 style={{ marginTop: 10 }}>{incomingCall.username}</h3>
                </div>
                <div className='accept-hangup-buttons'>
                  <FlatButton
                    primary
                    label='Accept'
                    style={{ marginRight: 10 }}
                    disabled={acceptRejectDisabled}
                    onClick={this.acceptIncomingCall.bind(this, incomingCall)} />
                  <FlatButton
                    secondary
                    label='Hangup'
                    disabled={acceptRejectDisabled}
                    onClick={this.closeIncomingCall.bind(this, incomingCall)} />
                </div>
              </Paper>
            ))
          }
        </div>
      </div>
    );
  }
}

export default hoc(CallConnectionManager);
