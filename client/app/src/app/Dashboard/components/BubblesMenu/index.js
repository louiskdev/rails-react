/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Link } from 'react-router';
import IconLock from 'material-ui/svg-icons/action/lock';
import Avatar from 'material-ui/Avatar';
import Badge from 'material-ui/Badge';
import CommonStyles from '@utils/CommonStyles';

import hoc from './hoc';

class BubblesMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      openCreateBubbles: false,
    };
  }

  componentDidMount() {
    const myBubbles = this.props.getMyBubbles.my_bubbles;
    if (myBubbles) {
      if (myBubbles.edges.length === 0) {
        this.props.toggleBubbleSearch(false);
      }
    }
    // Quick fix for total counter issue MYB-796
    setTimeout(() => {
      this.props.getMyBubbles.refetch();
    }, 1200);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.refetchBubbles) {
      this.props.getMyBubbles.refetch();
      this.props.stopRefetchBubbles();
    }
  }

  render() {
    if (!this.props.getMyBubbles.my_bubbles) {
      return (
      <div className='no-bubbles'>
        MyBubblz loading...
      </div>
      );
    }
    else {
      const { bubbleCounters } = this.props;
      if (!this.props.getMyBubbles.my_bubbles) {
        return <div>
          You have no bubbles yet.
        </div>;
      }
      // TODO fix
      const myBubblesInit = this.props.getMyBubbles.my_bubbles.edges;
      const myBubbles = JSON.parse(JSON.stringify(myBubblesInit));

      myBubbles.sort((bubble1, bubble2) => {
        const unreadCount1 = bubbleCounters[bubble1.node.id] ? bubbleCounters[bubble1.node.id] : bubble1.node.total_unread_items_count;
        const unreadCount2 = bubbleCounters[bubble2.node.id] ? bubbleCounters[bubble2.node.id] : bubble2.node.total_unread_items_count;
        if (unreadCount1 > unreadCount2) {
          return -1;
        }
        else if (unreadCount1 < unreadCount2) {
          return 1;
        }
        else {
          return 0;
        }
      });
      // Cache my bubblz data
      // const activeCacheObject = JSON.parse(localStorage.getItem('mbubblz_activeCache'));
      // activeCacheObject.myBubblz = true;
      // localStorage.setItem('mbubblz_activeCache', JSON.stringify(activeCacheObject));

      return (
        <div>
          {
            myBubbles.length > 0 ?
              (myBubbles.map((node, index) => {
                const bubble = node.node;
                const bubbleCounts = this.props.bubbleCounters[bubble.id] > -1 ?
                    this.props.bubbleCounters[bubble.id]
                  :
                    bubble.total_unread_items_count;
                let truncatedString = bubble.name;
                if (truncatedString.length > 16) {
                  truncatedString = `${truncatedString.substring(0, 16)}...`;
                }
                return (
                  <Link key={bubble.id} className='myb-feed' to={`/bubbles/${bubble.permalink}`}>
                    <span className='image-wrapper'>
                      <Avatar
                        src={bubble.avatar_url}
                        style={CommonStyles.dashBubblesMenu.bubbleImageStyle} size={32}
                      />
                      {
                        bubbleCounts > 0 ?
                          <span className='bubble-counter'>
                            <Badge
                              badgeContent={bubbleCounts > 9 ? '10+' : bubbleCounts}
                              badgeStyle={{
                                top: 0,
                                right: -14,
                                width: 16,
                                height: 16,
                                fontSize: 8,
                                fontWeight: 400,
                                backgroundColor: (bubbleCounts ? '#D97575' : 'transparent'),
                                color: '#FFFFFF',
                              }}
                              style={{ padding: 0 }}
                            />
                          </span>
                        :
                          null
                      }
                    </span>
                    <span className='myb-feed-label'>
                      {truncatedString}
                    </span>
                    {bubble.type === 'privy' ?
                      <IconLock style={{ position: 'absolute', top: 16, right: 26, width: 16, height: 16, color: '#bdbdbd' }} />
                    :
                      null
                    }
                  </Link>
                );
              }))
            :
              <div className='no-bubbles'>
                {this.props.keyword ? 'Bubbles not found' : 'You don\'t have any bubbles yet, join or create one'}
              </div>
          }
        </div>
      );
    }
  }
}

BubblesMenu.propTypes = {
  data: React.PropTypes.object,
  keyword: React.PropTypes.string,
  bubbleCounters: React.PropTypes.object,
};

export default hoc(BubblesMenu);
