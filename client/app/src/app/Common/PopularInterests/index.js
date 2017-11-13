/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import Avatar from 'material-ui/Avatar';
import { List, ListItem } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import RaisedButton from 'material-ui/RaisedButton';

import hoc from './hoc';

class PopularInterests extends Component {
  constructor(props) {
    super(props);

    this.state = {

    };
  }

  render() {

    if (this.props.data.loading) {
      return (
        <div>
          Interests loading...
        </div>
      );
    }
    else {
      const { popular_interests } = this.props.data;
      return (
        <div>
          <List>
            <Subheader>JUST FOR TEST</Subheader>
            {popular_interests.edges.map((interest, index)=>{
              return (
                <ListItem
                  leftAvatar={ <Avatar src='/assets/russian-mafia.png' /> }
                  primaryText={'@' + interest.node.name}
                  secondaryText={
                    <RaisedButton
                      label='Connect'
                      primary
                    />
                  }
                />
              );
            })}
          </List>
        </div>
      );
    }
  }
}

export default hoc(PopularInterests);
