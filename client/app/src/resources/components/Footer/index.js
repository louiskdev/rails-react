/* @flow */
/* eslint-disable max-len */

import React from 'react';
import { Grid, Row, Col } from 'react-flexbox-grid';
import { Link } from 'react-router';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';

class Footer extends React.Component {

  render() {
    return (
      <div className={`footer ${this.props.className}`}>
        <Grid className='footer_menuitems'>
          <Row>
            <Col xs={12} sm={6} md={3} lg={3}>
              <span className='target-fix' id='accordion1' />
              <a href='#accordion1' id='open-accordion1' className='footer_subheader footer_subheader_1 accordion-title'>Using Bubblz</a>
              <a href='#footer_menuitems' id='close-accordion1' className='footer_subheader accordion-title'>Using Bubblz</a>
              <Menu desktop className='footer_menu_1 accordion-content'>
                <MenuItem primaryText='How it works' containerElement={ <Link to={'/how_it_works'} /> } />
                <MenuItem primaryText='Help' className='inactive' disabled />
                <MenuItem primaryText='Video Guides' className='inactive' disabled />
                <MenuItem primaryText='API' className='inactive' disabled />
              </Menu>
            </Col>

            <Col xs={12} sm={6} md={3} lg={3}>
              <span className='target-fix' id='accordion2' />
              <a href='#accordion2' id='open-accordion2' className='footer_subheader footer_subheader_2 accordion-title'>About Us</a>
              <a href='#footer_menuitems' id='close-accordion2' className='footer_subheader accordion-title'>About Us</a>
              <Menu desktop className='footer_menu_2 accordion-content'>
                <MenuItem primaryText='Jobs' className='inactive' disabled />
                <MenuItem primaryText='Developers' className='inactive' disabled />
                <MenuItem primaryText='Events' className='inactive' disabled />
                <MenuItem primaryText='Blog' className='inactive' disabled />
              </Menu>
            </Col>

            <Col xs={12} sm={6} md={3} lg={3}>
              <span className='target-fix' id='accordion3' />
              <a href='#accordion3' id='open-accordion3' className='footer_subheader footer_subheader_3 accordion-title'>Legal</a>
              <a href='#footer_menuitems' id='close-accordion3' className='footer_subheader accordion-title'>Legal</a>
              <Menu desktop className='footer_menu_3 accordion-content'>
                <MenuItem primaryText='Terms of Service' containerElement={ <Link to={'/tos'} /> }/>
                <MenuItem primaryText='Privacy Policy' className='inactive' disabled />
                <MenuItem primaryText='Security' className='inactive' disabled />
              </Menu>
            </Col>

            <Col xs={12} sm={6} md={3} lg={3}>
              <span className='target-fix' id='accordion4' />
              <a href='#accordion4' id='open-accordion4' className='footer_subheader footer_subheader_4 accordion-title'>Useful Links</a>
              <a href='#footer_menuitems' id='close-accordion4' className='footer_subheader accordion-title'>Useful Links</a>
              <Menu desktop className='footer_menu_4 accordion-content'>
                <MenuItem primaryText='Download Mobile App' className='inactive' disabled />
                <MenuItem primaryText='Download Desktop App' className='inactive' disabled />
                <MenuItem primaryText='Bubblz for Business' className='inactive' disabled />
                <MenuItem primaryText='Server Status' className='inactive' disabled />
              </Menu>
            </Col>

          </Row>
        </Grid>
        <Row className='footer_copyright'>
          <Col xs={12}>
            <Row center='xs'>
              <Col xs={6} >
                2016 Copyright © MyBubblz.com - All Rights Reserved.
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Footer;
