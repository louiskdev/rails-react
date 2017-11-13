/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Link } from 'react-router';
import AppBar from 'material-ui/AppBar';
import HeaderRight from './HeaderRight';

const HeaderStyles = {
  backgroundColor: 'transparent',
  boxShadow: 'none',
  padding: 0,
  marginRight: 0,
};

const wrapperStyles = {
  lineHeight: '46px',
};

class Header extends Component {
  render() {
    const headerMobileIcon = '/assets/logo_mobile.png';

    return (
      <div className={this.props.transparent ? 'nav transparent' : 'nav'}>
        <div className='container'>
          <AppBar
            title={
              <Link to='/' className='app-menubar-item app-logo'>
                <img src='/assets/home-logo.png' role='presentation' />
              </Link>
            }
            showMenuIconButton={false}
            className={this.props.transparent ? 'nav-header transparent' : 'nav-header'}
            titleStyle={wrapperStyles}
            style={HeaderStyles}
            iconElementRight={
              <HeaderRight transparent={this.props.transparent}/>
            }
            iconStyleRight={{
              marginRight: 0,
            }}
          />
        </div>
      </div>
    );
  }
}

export default Header;
