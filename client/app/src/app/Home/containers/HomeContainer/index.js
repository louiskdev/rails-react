/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import $ from 'jquery';
import Slider from 'react-slick';
import Typist from 'react-typist';
import SignupForm from '@common/SignupForm';

class HomeContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      autoplay: true,
      slickGoTo: 0,
      typingActive: false,
      userEmail: '',
    };
    this.slideTimer = null;
  }

  componentDidMount = () => {
    const self = this;

    $(document).on('touchend', '.form-signup-email input', function() {
      $(this).focus();
      if (!self.state.autoplay) {
        self.setState({
          autoplay: true,
        });
      }
    });

    $(document).mouseup(function(e) {
      const container = $('.form-signup-email input');

      const isTarget = container.is(e.target);

      if (isTarget) {
        if (self.state.autoplay) {
          self.setState({
            autoplay: false,
          });
        }
        else {
          self.setState({
            autoplay: true,
          });
        }
      }
      else {
        self.setState({
          autoplay: true,
        });
      }
    });
  }

  changeSlide = (slideId) => {
    if (!this.state.typingActive) {
      this.refs.slider.slickGoTo(slideId);
    }
    else {
      setTimeout(() => {
        this.goToSlide(slideId);
      }, 500);
    }
  }

  goToSlide = (slideId) => {
    if (!this.state.typingActive) {
      setTimeout(() => {
        this.changeSlide(slideId);
      }, 6000);
    }
    else {
      setTimeout(() => {
        this.goToSlide(slideId);
      }, 500);
    }
  }

  setTypingStatus = (status) => {
    this.setState({
      typingActive: status,
      autoplay: !status,
    });
  }

  clearSliderTimer = () => {
    clearTimeout(this.slideTimer);
  }

  render() {

    const settings = {
      arrows: false,
      autoplay: this.state.autoplay,
      autoplaySpeed: 8000,
      centerMode: true,
      centerPadding: 0,
      dots: false,
      draggable: false,
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      speed: 3000,
      lazyLoad: true,
      fade: true,
      swipe: false,
      swipeToSlide: false,
      touchMove: false,
    };

    const typistSettings = {
      startDelay: 2000,
      avgTypingDelay: 120,
      cursor: {
        hideWhenDone: true,
        hideWhenDoneDelay: 300,
      },
    };

    const bubbles = (<div id='bubbles'>
      <div className='bubble x21' />
      <div className='bubble x22' />
      <div className='bubble x23' />
      <div className='bubble x24' />
      <div className='bubble x25' />
      <div className='bubble x26' />
      <div className='bubble x27' />
      <div className='bubble x28' />
      <div className='bubble x29' />
      <div className='bubble x27' />
      <div className='bubble x28' />
      <div className='bubble x29' />
      <div className='bubble x290' />
      <div className='bubble x291' />
    </div>);

    const signupForm = <SignupForm setTypingStatus={this.setTypingStatus} clearSliderTimer={this.clearSliderTimer} />;

    return (
      <div className='slider-wrapper'>
        <Slider {...settings} ref='slider'>
          <div className='slide1'>
              <div className='container'>
                <div className='row'>
                  <div className='introsection'>
                    <h1>The New <b>Privacy</b>
                      <Typist {...typistSettings}>Minded Social Media</Typist>
                    </h1>
                    <p>Create unique groups for friends, family members, teammates, fellow workers or colleagues. Or interact with new acquaintances without having to share your most personal data. You decide what you share with each group while remaining private from others.</p>
                    {signupForm}
                  </div>
                </div>
            </div>
            {bubbles}
          </div>
          <div className='slide2'>
            <div className='container'>
              <div className='row'>
                <div className='introsection'>
                  <h1><b>Collaboration</b>
                    <Typist {...typistSettings}>Made Easy</Typist>
                  </h1>
                  <p>Chat, share, and exchange ideas with the tools you select for each group. Add widgets to your bubble that fit your needs, each bubble is unique and custom.</p>
                  {signupForm}
                </div>
              </div>
            </div>
            {bubbles}
          </div>
          <div className='slide3'>
            <div className='container'>
              <div className='row'>
                <div className='introsection'>
                  <h1>Connect with <b>People</b>
                    <Typist {...typistSettings}>With Similar <b>Interests</b></Typist>
                  </h1>
                  <p>Discover new people or public groups with whom you share common interests, even sorting by geolocation. We help you search, explore and interact selectively with individuals or groups of individuals you choose. You are in complete control of your social networking experience at all times!</p>
                  {signupForm}
                </div>
              </div>
            </div>
            {bubbles}
          </div>
        </Slider>
      </div>
    );
  }
}

HomeContainer.propTypes = {

};

export default HomeContainer;
