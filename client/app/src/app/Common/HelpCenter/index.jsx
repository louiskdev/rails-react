/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';

import HelpSidebar from './HelpSidebar';
import About from './About';
import LoginAndPass from './LoginAndPass';
import Notifications from './Notifications';

class HelpCenter extends Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  render() {

    let helpPage = <About />;
    if (this.props.params.help_page === 'login-and-pass') {
      helpPage = <LoginAndPass />
    }
    else if (this.props.params.help_page === 'notificaitons') {
      helpPage = <Notifications />
    }

    return (
    <div className='help-center'>
      <HelpSidebar />
      <div className='help-page-content'>
        {helpPage}
      </div>
    </div>
    );
  }

}

export default HelpCenter;
