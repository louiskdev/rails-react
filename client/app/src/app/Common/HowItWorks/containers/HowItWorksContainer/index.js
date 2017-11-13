/* @flow */

import React, { Component } from 'react';
import { Link } from 'react-router';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import CommonStyles from '@utils/CommonStyles';

let slideTimer;

class HowItWorksContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openWatchVideo: false,
    };
  }

  handleDialogOpen = () => {
    this.setState({
      openWatchVideo: true,
    });
  }

  handleDialogClose = () => {
    this.setState({
      openWatchVideo: false,
    });
  }

  setTypingStatus = (email, status) => {
    this.setState({
      userEmail: email,
      typingActive: status,
    });
  }

  clearSliderTimer = () => {
    clearTimeout(slideTimer);
  }

  render() {
    const { data } = this.props;
    const loading = false;

    const bubbles = <div id='bubbles'>
      <div className='bubble x21' />
      <div className='bubble x22' />
      <div className='bubble x23' />
      <div className='bubble x24' />
      <div className='bubble x25' />
      <div className='bubble x26' />
      <div className='bubble x27' />
      <div className='bubble x28' />
      <div className='bubble x29' />
      <div className='bubble x290' />
      <div className='bubble x291' />
    </div>;

    const TabsControl = React.createClass({

      getInitialState: function() {
        return { currentIndex: 0 };
      },

      getTitleItemCssClasses: function(index) {
        return index === this.state.currentIndex ? 'tab-title-item active' : 'tab-title-item';
      },

      getContentItemCssClasses: function(index) {
        return index === this.state.currentIndex ? 'tab-content-item active' : 'tab-content-item';
      },

      render: function() {
        const that = this;
        return (
          <div>
            <div className='tab-title-items'>
              {React.Children.map(this.props.children, (element, index) => {
                return (<div onClick={() => {this.setState({ currentIndex: index });}} className={that.getTitleItemCssClasses(index)}>
                  <img src={element.props.src} />
                  <div className='label'>{element.props.name}</div>
                </div>);
              })}
            </div>
            <div className='tab-content-items'>
              {React.Children.map(this.props.children, (element, index) => {
                return (<div className={that.getContentItemCssClasses(index)}>
                  {element}
                </div>);
              })}
            </div>
          </div>
        );
      },
    });

    const Tab = React.createClass({
      render: function() {
        return (<div>{this.props.children}</div>);
      },
    });

    // Styles for 'welcome section' components

    const videoStyle = {
      maxWidth: '100%',
      width: '100%',
      maxHeight: '100%',
      height: 'auto',
    };

    return (

      <div className='hiw-page lt-content-wrapper'>

        {/* Section 1: Welcome screen with CTA button */}

        <div className='welcome-section'>
          <div className='welcome-wrapper purplebg'>
            <div className='container'>
                <div className='introsection'>
                  <h1>See How <b>MyBubblz</b> Keeps You <b>Private</b></h1>
                  <p>New things can be confusing, but we have your back !</p>
                <FlatButton
                  backgroundColor={CommonStyles.outside.buttonBackgroundColor}
                  hoverColor={CommonStyles.outside.buttonHoverColor}
                  labelColor={CommonStyles.outside.buttonLabelColor}
                  labelStyle={CommonStyles.outside.signButtonLabelStyle}
                  style={{ ...CommonStyles.outside.signButtonStyle, width: 'auto' }}
                  primary
                  label='Video Tour &nbsp; ▶'
                  onClick={this.handleDialogOpen}
                />
               </div>
            </div>

            <Dialog modal={false} open={this.state.openWatchVideo} onRequestClose={this.handleDialogClose}>
              <video controls autoPlay style={videoStyle}>
              	<source src='http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4' type='video/mp4' />
              	<p>Your browser does not support this video format.</p>
              </video>
            </Dialog>

          </div>
        </div>

        {/* Section 2: Features description using slider */}

        <div className='features-section'>
          <div className='lt-wrapper'>
            <div className='features-overview'>
              <div className='features-slider'>
                <TabsControl>
                  <Tab name='Private bubbles' src='/assets/how_it_works/lock.png'>
                    <div className='description'>
                      Keep your content private between users. What you share in private bubbles can only be viewed by
                      those who are also member of that bubble. Share the content of your virtual life the same way you do in real life.
                    </div>
                    <div className='illustration-wrapper'>
                      <div className='illustration-body grey' />
                    </div>
                  </Tab>
                  <Tab name='Public bubbles' src='/assets/how_it_works/bubble.png'>
                    <div className='description'>
                      Create bubbles that relate to your interests. Let others around you or anywhere find, join and
                      participate in your bubble.
                    </div>
                    <div className='illustration-wrapper'>
                      <div className='illustration-body green' />
                    </div>
                  </Tab>
                  <Tab name='Customizable widgets' src='/assets/how_it_works/widget.png'>
                    <div className='description'>
                      Widgets provide your bubbles such powerful tools as file sharing, whiteboard, video and text chat,
                      calendar scheduling, guest registry, wedding registry and many more. We also provide an API for you
                      to create your own widgets or the option to link up services like Dropbox, Google Drive and many more.
                    </div>
                    <div className='illustration-wrapper'>
                      <div className='illustration-body blue' />
                    </div>
                  </Tab>
                </TabsControl>
              </div>

              <div className='features-special'>
                <div className='special-wrapper'>
                  <div className='special-illustration'>
                    <img src='/assets/how_it_works/api.png' />
                  </div>
                  <div className='special-description'>
                    <h3 className='special-heading'>Collaborate with friends and colleagues in one place</h3>
                    <div className='special-body'>
                      No more switching between multiple different services or apps to keep creativity going. You can
                      benefit from all those services in one place - one login, one bubble, multiple widgets. Keep your life and business organized but separated with increase productivity receiving notifications from your widgets all in one location.
                    </div>
                    <div className='special-join'>
                      <Link to={'/'}>Join Mybubblz <span>▶</span></Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div className='substrate' />
        </div>

        { /* Section 3: Yet some another features */ }

        <div className='additional-section'>
          <div className='lt-wrapper'>
            <div className='additional-overview'>
              <div className='private-feature'>
                <h3 className='private-heading'>
                  <img src='/assets/how_it_works/privacy.png' />
                  <h3>Remain private and anonymous</h3>
                </h3>
                <p>
                  Your profile will not be searchable by search engines and we only ask for your first name during registration. Other users cannot search you by your name and your private content is hidden from others unless they are in the same private bubble.
                </p>
              </div>
              <div className='separator' />
              <div className='rate-feature'>
                <h3 className='rate-heading'>
                  <img src='/assets/how_it_works/rate.png' />
                  <div>Rate posts for curated feeds</div>
                </h3>
                <p>
                  Tired of seeing irrelevant content on your social media feeds?
                  Our artificially intelligent platform strives to keep your content relevant and concise.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

}

export default HowItWorksContainer;
