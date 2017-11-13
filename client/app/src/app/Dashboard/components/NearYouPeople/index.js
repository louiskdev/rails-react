/* @flow */

import React, { Component } from 'react';
import { Link } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import Avatar from 'material-ui/Avatar';
import { List } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import CommonStyles from '@utils/CommonStyles';

import hoc from './hoc';

class NearYouBubblz extends Component {

  constructor(props) {
    super(props);
    this.state = {
      bubble_id: null,
    };
  }

  render() {
    if (this.props.data.errors) {
      if (this.props.data.errors.message !== '') {
        setTimeout(() => {
          this.props.router.push('/signin');
        }, 50);
        setTimeout(()=> {
          localStorage.setItem('mbubblz_client_id', '');
          localStorage.setItem('mbubblz_token', '');
          localStorage.setItem('mbubblz_user', '');
          localStorage.setItem('mbubblz_username', '');
        }, 1000);
        return;
      }
    }
    if (this.props.data.loading) {
      return (<div>People near you loading ...</div>);
    }

    const bubbles = this.props.data.interesting_users.edges;

    const bubblesCount = bubbles.length;
    if (!bubblesCount) {
      return (
        <div style={CommonStyles.userBubblz.containerStyle}>
          People near you not found
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
        <Subheader style={subheaderStyles}>People near you</Subheader>
        {
          bubbles.length > 0 ?
            (bubbles.map((item, index) => {
              const bubble = item.node;
              return (
                <div
                  key={bubble.id}
                  className='bubbles-item'
                  style={{ padding: '0 12px', margin: '20px 0 0 0', float: 'left', minHeight: 190, width: '17%', textAlign: 'center' }}
                >
                <div style={{ left: 0 }}>
                  <Link to={`/u/${bubble.username}`}>
                    <Avatar
                      src={bubble.avatar_url}
                      size={56}
                    />
                  </Link>
                </div>

                <span style={{ margin: '12px 0', display: 'block', height: '17px', overflow: 'hidden' }}>
                  <Link to={`/u/${bubble.username}`}>
                    {bubble.username}
                  </Link>
                </span>

                <div className='bubble-actions' style={{ height: 40, top: 0, margin: '20px auto' }}>

                  <Link to={`/u/${bubble.username}`} style={{ top: '12px', right: '0px' }}>
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
              People near you not found
            </div>
        }
      </List>
    );
  }
}

export default hoc(NearYouBubblz);
