/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import Dialog from 'material-ui/Dialog';
import { Scrollbars } from 'react-custom-scrollbars';
import IconClose from 'material-ui/svg-icons/navigation/close';

// import Search from '@common/Search';
import AddInterest from '@common/AddInterest';
import CommonStyles from '@utils/CommonStyles';

class Interests extends Component {

  static contextTypes = {
    searchKeyword: React.PropTypes.object,
  }

  /* getChildContext() {
    return {searchKeyword: this.state.clickedItem};
  }*/

  constructor(props) {
    super(props);
    this.state = {
      openAddInterest: false,
      clickedItem: '',
    };
  }

  handleAddInterestClose = () => {
    this.setState({
      openAddInterest: false,
    });
  }

  addInterest = (addingInterest) => {
    if (!this.props.addInterest) {
      return;
    }
    this.props.addInterest(addingInterest)
    .then(() => {
      this.setState({
        openAddInterest: false,
      });
    })
    .catch(() => {
      this.setState({
        openAddInterest: false,
      });
    });
  }

  render() {
    const { interests } = this.props;

    return (
      <div className='user-interests'>
        <div className='interests-wrapper'>
          {interests.length > 0 ?
            interests.map((item, index) => {
              return <a
                className={this.props.isAdmin ? 'interest allowEdit' : 'interest'}
                href='javascript:void(0)'
                key={index}
              >
                <span onClick={() => this.props.changeSearchKeyword(item.node.name) }>
                  {item.node.name}
                </span>
                {this.props.isAdmin ?
                  <span
                    className='remove-interest'
                    style={{ cursor: 'pointer', width: 20, height: 20 }}
                    onClick={(e) => {e.preventDefault(); this.props.removeInterest(item.node.name);} }
                  >
                    <IconClose color='#ffffff' style={{ width: 16, height: 16, verticalAlign: '-25%' }}/>
                  </span>
                  :
                  null
                }
              </a>;
            })
          :
            (this.props.isAdmin ?
              <span className='no-interests'>
                {this.props.isBubble ?
                  'Add bubble interests'
                  :
                  'Add your interests'
                }
              </span>
              :
              null
            )
          }
          {this.props.isAdmin ?
            <Dialog
              className='gallery-media-preview'
              modal={false}
              open={this.state.openAddInterest}
              onRequestClose={this.handleAddInterestClose}
              autoDetectWindowHeight
              autoScrollBodyContent={false}
              contentStyle={{ ...CommonStyles.dialog.content, transform: 'translate(0px, 110px)', width: 300 }}
              bodyStyle={ CommonStyles.dialog.body }
              style={ CommonStyles.dialog.root }
              repositionOnUpdate={ false }
            >
              <AddInterest cancelRequest={this.handleAddInterestClose} addInterest={this.addInterest} />
            </Dialog>
            :
            null
          }
          {
            this.props.addInterest && interests.length < 5 && this.props.isAdmin ?
            <a className='add-interest' href='javascript:void(0)' onClick={() => this.setState({ openAddInterest: true })}>Add</a>
            :
            undefined
          }
        </div>
      </div>
    );
  }
}

export default Interests;
