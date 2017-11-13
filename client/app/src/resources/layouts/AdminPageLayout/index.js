import React, { Component } from 'react';
import Notifications from 'react-notify-toast';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';

import CommonStyles from '@admin/CommonStyles';

class AdminPageLayout extends Component {

  state = {
    openMenu: false,
  }

  onToggleMenu = () => {
    const { openMenu } = this.state;
    this.setState({
      openMenu: !openMenu,
    });
  }

  handleClickStatistics = () => {
    this.props.router.push('/mybubblz-admin');
  }

  handleClickMassEmailing = () => {
    this.props.router.push('/mybubblz-admin/mass-emailing');
  }

  render() {
    const { children } = this.props;
    const { openMenu } = this.state;

    return (
      <div>
        <Notifications />
        <AppBar
          title='MyBubblz Admin'
          iconStyleRight={{ display: 'none' }}
          onLeftIconButtonTouchTap={this.onToggleMenu} />
        <Drawer
          open={openMenu}
          docked={false}
          onRequestChange={this.onToggleMenu}>
          <MenuItem onClick={this.handleClickStatistics}>Statistics</MenuItem>
          <MenuItem onClick={this.handleClickMassEmailing}>Mass emailing</MenuItem>
        </Drawer>
        <div style={CommonStyles.wrapperStyle}>
          {children}
        </div>
      </div>
    );
  }

}

export default AdminPageLayout;
