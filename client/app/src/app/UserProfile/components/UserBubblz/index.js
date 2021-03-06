/* @flow */

import React, { Component } from 'react';
import { Link } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import Avatar from 'material-ui/Avatar';
import IconLock from 'material-ui/svg-icons/action/lock';
import IconSocialPeople from 'material-ui/svg-icons/social/people';
import IconActionFavorite from 'material-ui/svg-icons/action/favorite';
import { List } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import CommonStyles from '@utils/CommonStyles';

class UserBubblz extends Component {

  render() {
    const { bubbles } = this.props;

    const bubblesCount = bubbles.length;
    if (!bubblesCount) {
      return (
        <div style={CommonStyles.userBubblz.containerStyle}>
          No bubblz yet
        </div>
      );
    }
    const subheaderStyles = {
      fontSize: 13,
      borderBottom: '1px solid #f1f1f1',
      borderTop: '1px solid #f1f1f1',
      lineHeight: '42px',
      marginBottom: 12,
      display: 'flex',
      alignitems: 'center',
      justifyContent: 'space-between',
      textTransform: 'uppercase',
    };

    return (
      <List className='bubbles-list' style={{ backgroundColor: '#ffffff', overflow: 'auto' }}>
        <Subheader style={subheaderStyles}>Bubbles</Subheader>
        {
          bubbles.length > 0 ?
            (bubbles.map((item, index) => {
              const bubble = item.node;
              return (
                <div
                  key={bubble.id}
                  className='bubbles-item' style={{ padding: '0 12px', margin: '20px 0 0 0', float: 'left', minHeight: 190, width: '25%', textAlign: 'center' }}>

                  <div style={{ left: 0 }}>
                    <Avatar
                      src={bubble.avatar_url}
                      size={56}
                    />
                  </div>

                  {
                    bubble.type === 'privy' ?
                      <span style={{ margin: '12px 0', display: 'block', height: '17px', overflow: 'hidden' }}>{bubble.name} <IconLock style={{ top: 8, width: 16, height: 16, color: '#bdbdbd' }} /></span>
                    :
                      <span style={{ margin: '12px 0', display: 'block', height: '17px', overflow: 'hidden' }}>{bubble.name}</span>
                  }

                  <div>
                    <IconSocialPeople color={CommonStyles.userBubblz.grayColor} style={{ ...CommonStyles.userBubblz.iconStyle, marginRight: 5 }} />
                    <span style={CommonStyles.userBubblz.statStyle}>{bubble.members_count}</span>
                    <IconActionFavorite color={CommonStyles.userBubblz.grayColor} style={{ ...CommonStyles.userBubblz.iconStyle, marginLeft: 10, marginRight: 5 }} />
                    <span style={CommonStyles.userBubblz.statStyle}>{bubble.members_count}</span>
                  </div>

                  <div className='bubble-actions' style={{ height: 40, margin: '20px auto' }}>
                    <Link to={`/bubbles/${bubble.permalink}`} style={{ top: '12px', right: '0px' }}>
                      <RaisedButton
                        className='view-button'
                        color='#ffffff'
                        hoverColor='#62db95'
                        label='View'
                        labelStyle={{ textTransform: 'none', color: '#62db95' }}
                        style={{ boxShadow: 'none', border: '2px solid #62db95', borderRadius: '4px' }}
                      />
                    </Link>
                </div>
              </div>
              );
            }))
        :
          <div className='no-bubbles'>
            User doesn't have any bubbles yet
          </div>
        }
      </List>
    );
  }
}

export default UserBubblz;
