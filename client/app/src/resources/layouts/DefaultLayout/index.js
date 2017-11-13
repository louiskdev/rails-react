/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import Notifications from 'react-notify-toast';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

class DefaultLayout extends Component {

  render() {
    const { children } = this.props;
    const pathname = this.props.location.pathname.replace(/\//g, '');
    const siginURLs = (pathname === 'complete_registration')
      || (pathname === 'create_password')
      || (pathname === 'signin')
      || (pathname === 'forgot_password')
      || (pathname === 'reset_password');

    let headerSection = null;
    let footerSection = null;
    if (siginURLs) {
      footerSection = <Footer className='whiteBackground' />;
    }
    else if (pathname === 'how_it_works') {
      headerSection = <Header />;
      footerSection = <Footer className='darkBackground' />;
    }
    else if (pathname === 'tos' || pathname === 'news_and_updates') {
      headerSection = <Header />;
      footerSection = <Footer className='whiteBackground' />;
    }
    else {
      headerSection = <Header />;
      if (pathname === '' || pathname === 'tos' || pathname === 'news_and_updates') {
        footerSection = <Footer className='whiteBackground' />;
      }
      else {
        footerSection = <Footer />;
      }
    }

    return (
      <div id='mybubblz-root-app'>
        { headerSection }
        <Notifications />
        {children}
        { footerSection }
      </div>
    );
  }
}

export default DefaultLayout;
