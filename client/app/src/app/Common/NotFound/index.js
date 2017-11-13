/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Link } from 'react-router';

class NotFound extends Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  render() {

    return (
    <div className='error-page'>
      <h1>HMM...</h1>
      <p>We can't find page you're looking for.</p>
      <p>Were you trying to link to <Link to='/'>Your profile</Link> or <Link to='/friends'>Friends feed</Link>?</p>
    </div>
    );
  }

}

export default NotFound;
