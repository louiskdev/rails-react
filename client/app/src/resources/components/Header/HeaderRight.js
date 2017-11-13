
/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';
import CommonStyles from '@utils/CommonStyles';

class HeaderRight extends Component {
  render() {
    return (
      <div className='header-right-block'>
        <FlatButton
          href='/how_it_works'
          label='How it works'
          hoverColor={CommonStyles.outside.buttonHowitworks}
          labelStyle={{
            color: this.props.transparent ? '#000000' : '#ffffff',
            textTransform: 'none',
            fontWeight: '500',
          }}
          className='header-top-button'
          style={{
            lineHeight: '33px',
            border: '1px solid #fff',
          }}
        />
        <span style={{ width: 8, display: 'inline-block' }} />
        <FlatButton
          label='Sign In'
          labelStyle={{
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: '500',
          }}
          hoverColor='#44BBA4'
          href='/signin'
          secondary
          className='header-top-button'
          style={{
            lineHeight: '33px',
            border: '1px solid #44BBA4',
          }}
        />
      </div>
    );
  }
}

export default HeaderRight;
