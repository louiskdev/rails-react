import React, { Component } from 'react';
import IconSocialPeople from 'material-ui/svg-icons/social/people';
import IconActionFavorite from 'material-ui/svg-icons/action/favorite';
import Avatar from 'material-ui/Avatar';
import { ListItem } from 'material-ui/List';
import CommonStyles from '@utils/CommonStyles';

class EventListItem extends Component {

  formatDateTime = (date) => {
    const _date = new Date(date);
    const month = _date.getMonth() + 1;
    let dstr = '';
    dstr = dstr + _date.getFullYear() + '-';
    dstr = dstr + (month < 10 ? '0' : '') + month + '-';
    dstr = dstr + (_date.getDate() < 10 ? '0' : '') + _date.getDate() + ' ';
    const h = _date.getHours() % 12;
    dstr = dstr + ' at ' + (h < 10 ? '0' : '') + h + ':00 ';
    const h_am_pm = _date.getHours() < 12 ? 'AM' : 'PM';
    dstr = dstr + h_am_pm;
    return dstr;
  }

  render() {
    const eventStyle = {
      minHeight: 95,
      padding: '0 0 15px 105px',
      position: 'relative',
    };
    const eventBottomBorderStyle = {
      marginBottom: 15,
      borderBottom: '1px solid #f7f7f7',
    };
    const avatarStyle = {
      display: 'block',
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 999,
      left: 0,
      top: 0,
    };
    const titleStyle = {
      fontSize: 16,
    };
    const datetimeStyle = {
      fontSize: 12,
      marginBottom: 10,
    };
    const grayColor = '#d4d6d9';
    const iconStyle = {
      width: 20,
      height: 20,
      verticalAlign: 'middle',
    };
    const statStyle = {
      fontSize: 12,
      color: grayColor,
    };
    const joinButtonContainerStyle = {
      position: 'absolute',
      right: 0,
      top: 10,
    };

    const { event, buttons, last } = this.props;

    return (
      <ListItem
        key={event.id}
        className='bubbles-item'
        hoverColor='#ffffff'
        leftAvatar={
          <span style={{ left: 0 }}>
            <Avatar
              src={event.avatar_url}
              size={56}
            />
          </span>
        }
        primaryText={
          <span style={{ display: 'block', height: '17px', overflow: 'hidden' }}>{event.name}</span>
        }
        secondaryTextLines={1}
        secondaryText={
          <span>
            <div style={{ margin: '4px 0', color: '#8E9399', fontSize: '0.85em' }}>{event.address} · {this.formatDateTime(event.start_date)}</div>
            <div>
              <IconSocialPeople color={CommonStyles.userBubblz.grayColor} style={{ ...CommonStyles.userBubblz.iconStyle, marginRight: 5 }} />
              <span style={CommonStyles.userBubblz.statStyle}>{event.members_count}</span>
              <IconActionFavorite color={CommonStyles.userBubblz.grayColor} style={{ ...CommonStyles.userBubblz.iconStyle, marginLeft: 10, marginRight: 5 }} />
              <span style={CommonStyles.userBubblz.statStyle}>{event.likes_count}</span>
            </div>
          </span>
        }
        rightIcon={
          <span className='bubble-actions' style={{ height: 40, top: 0, width: 'auto', margin: '20px 0', textAlign: 'right' }}>
            {
              buttons.map((button, i) => (
                <span key={i}>{button}&nbsp;</span>
              ))
            }
          </span>
        }
        innerDivStyle={{ padding: '16px 200px 16px 74px' }}
        style={{ padding: '0px 24px' }}
      />
    );
  }
}

export default EventListItem;
