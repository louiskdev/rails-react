/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Link } from 'react-router';

class About extends Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  render() {

    return (
    <div className='help-dashboard'>
      <div className="dashboard-item">
        <Link to="/help/about" className="header-big-link">About</Link>
      </div>
      <div className="dashboard-item">
        <Link to="/help/login-and-pass" className="header-big-link">Login and Pass</Link>
        {/*<Link to="/help/getting-started" className="header-link">Getting Started<span className="count">(4)</span></Link>
        <Link to="/help/help1">Help link 1</Link>
        <Link to="/help/help2">Help link 1</Link>
        <Link to="/help/help3">Help link 1</Link>
        <Link to="/help/getting-started" className="view-all-link">View all</Link>*/}
      </div>
      <div className="dashboard-item">
        <Link to="/help/notifications" className="header-big-link">Notifications</Link>
      </div>
    </div>
    );
  }

}

export default About;
