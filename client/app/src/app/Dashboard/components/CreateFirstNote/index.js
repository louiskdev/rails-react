/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import { Grid, Row, Col } from 'react-flexbox-grid';
import ReactGA from 'react-ga';

import InputField from '@common/InputField';

import hoc from './hoc';

class CreateFirstNote extends Component {
  constructor(props) {
    super(props);

    this.state = {
      createNoteValue: '',
    };

  }

  createNote = (vars) => {
    const self = this;

    this.props.createFirstNote({ variables: vars })
    .then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
      }
      else {

        self.props.updateFeed(data);
        // self.props.updateFeed();

        ReactGA.event({
          category: 'Feed',
          action: 'Wrote a note (first)',
        });
      }

    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  render() {

    const textAreaStyle = {
      backgroundColor: '#fff',
      border: '1px solid #e9e8e8',
      borderRadius: 4,
      padding: '0 15px',
      width: '100%',
      height: 120,
      maxHeight: 120,
      overflowY: 'auto',
      fontSize: 14,
    };
    const paperStyle = {
      width: '100%',
      height: 200,
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
      marginBottom: 15,
    };

    return (
      <div>
        <div className='tutorial-videos'>
          <h1>How to Bubble</h1>
          <Grid style={{ width: '100%' }}>
            <Row>
              <Col xs={12} sm={6}>
                <Paper style={paperStyle} zDepth={1}>
                  <div style={{
                    height: 155,
                    backgroundImage: 'url(/assets/video1.png)',
                    position: 'relative',
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(49, 49, 49, 0.25)',
                      borderTopLeftRadius: 2,
                      borderTopRightRadius: 2,
                    }}>
                      <a><img
                        src='/assets/play-button.png'
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          margin: '-25px 0 0 -25px',
                        }}
                      /></a>
                    </div>
                  </div>
                  <div className='video-title'>
                    How MyBubblz works
                  </div>
                </Paper>
              </Col>
              <Col xs={12} sm={6}>
                <Paper style={paperStyle} zDepth={1}>
                  <div style={{
                    height: 155,
                    backgroundImage: 'url(/assets/video1.png)',
                    position: 'relative',
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(49, 49, 49, 0.25)',
                      borderTopLeftRadius: 2,
                      borderTopRightRadius: 2,
                    }}>
                      <a><img
                        src='/assets/play-button.png'
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          margin: '-25px 0 0 -25px',
                        }}
                      /></a>
                    </div>
                  </div>
                  <div className='video-title'>
                    How MyBubblz works
                  </div>
                </Paper>
              </Col>
            </Row>
          </Grid>
        </div>
        <Divider style={{ margin: '18px 0 24px 0', color: '#5E5E5E' }} />
        <InputField rows={4} style={textAreaStyle} type='note' submitMessage={this.createNote} />
      </div>
    );
  }
}

export default hoc(CreateFirstNote);
