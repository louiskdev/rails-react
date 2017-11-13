/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import Avatar from 'material-ui/Avatar';
import Divider from 'material-ui/Divider';
import IconTrending from 'material-ui/svg-icons/action/trending-up';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import hoc from './hoc';

class InterestingBubbles extends Component {
  constructor(props) {
    super(props);

    this.state = {
      bubbles: [],
    };

  }

  loadMoreBubbles = () => {
    let _bubbles = this.state.bubbles;
    if (!_bubbles.length) {
      _bubbles = this.props.data.interesting_bubbles.edges;
    }
    if (!_bubbles.length) {
      return;
    }

    if (this.props.viewMore) {
      // Update feed data
      if (_bubbles) {
        _bubbles.forEach((bubble) => {
          _bubbles.splice(3, 3);
        });
      }
      this.setState({
        bubbles: _bubbles,
      });
      this.props.onClickViewMore(false);

    }
    else {

      this.props.client.query({
        query: gql`
          query getMyBubbles($version: String!) {
            interesting_bubbles(first: 12) {
              edges {
                cursor
                node {
                  name
                  permalink
                  avatar_url(version: $version)
                }
              }
            }
          }
        `,
        variables: {
          version: 'micro',
        },
        activeCache: false,
        forceFetch: true,
      }).then((graphQLResult) => {

        const { errors, data } = graphQLResult;

        if (errors) {
          if (errors.length > 0) {
            notify.show(errors[0].message, 'error', 2000);
          }
        }
        else {
          // Update feed data
          this.setState({
            bubbles: data.interesting_bubbles.edges,
          });
          this.props.onClickViewMore(true);
        }

      }).catch((error) => {
        notify.show(error.message, 'error', 2000);
      });

    }
  }

  render() {

    if (!this.props.data.interesting_bubbles) {
      return (
        <div>
          Trending bubbles loading...
        </div>
      );
    }
    else {
      const interesting_bubbles = this.state.bubbles.length && this.props.viewMore ? this.state.bubbles : this.props.data.interesting_bubbles.edges;

      const titleStyle = {
        fontSize: 15,
        color: '#686868',
        textTransform: 'uppercase',
        marginBottom: '8px',
        marginTop: '18px',
      };
      const avatarContainerStyle = {
        marginRight: 12,
        marginBottom: 12,
        position: 'relative',
        float: 'left',
        color: '#000',
      };
      let view_more = null;
      if (interesting_bubbles.length >= 3) {
        view_more = <a className='view_more' onClick={this.loadMoreBubbles.bind(this)}>View more</a>;
        if (this.props.viewMore) {
          view_more = <a className='view_more' onClick={this.loadMoreBubbles.bind(this)}>View less</a>;
        }
      }
      return (
        <div style={{ marginBottom: 10 }}>
          <Divider style={CommonStyles.dividerStyle} />
          <div style={titleStyle}>
            <IconTrending color='#686868' style={{ verticalAlign: '-30%', marginRight: '4px' }}/>Trending Bubbles
          </div>
          <div className='mui--clearfix'>
            <div className='inner-wrapper'>
              {interesting_bubbles.map((bubble, index)=>{
                let bubblename = `${bubble.node.name}`;
                if (bubblename.length > 7) {
                  bubblename = `${bubblename.substring(0, 7)}...`;
                }
                return (
                  <Link key={index} style={avatarContainerStyle} to={`/bubbles/${bubble.node.permalink}`}>
                    <div className='avatar-wrapper'>
                      <Avatar src={bubble.node.avatar_url} />
                    </div>
                    <div className='username-wrapper'>{bubblename}</div>
                  </Link>
                );
              })}
            </div>
          </div>
          {view_more}
        </div>
      );
    }
  }
}

export default withApollo(hoc(InterestingBubbles));
