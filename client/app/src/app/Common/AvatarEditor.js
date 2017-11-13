/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import CropperJS from 'react-cropperjs';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import RotateLeft from 'material-ui/svg-icons/image/rotate-left';
import RotateRight from 'material-ui/svg-icons/image/rotate-right';
import { Grid, Row, Col } from 'react-flexbox-grid';

class AvatarEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cropperPreviewOpen: true,
      previewImg: '',
    };
  }

  cancelPreviewCrop = () => {
    this.setState({
      cropperPreviewOpen: false,
    });
    if (this.props.cancelNewImg) {this.props.cancelNewImg();}
  }

  handlePreviewCrop = () => {
    const type = this.props.type ? this.props.type : 'image/png';
    const img = this.refs.cropperPreview.getCroppedCanvas().toDataURL(type);

    const crop_data = this.refs.cropperPreview.getData();
    this.props.setNewImg(img, crop_data);

    this.setState({
      previewImg: null,
      cropperPreviewOpen: false,
    });
  };

  handlePreviewRotate = (degree) => {
    this.refs.cropperPreview.rotate(degree);
  };

  render() {
    const previewImg = this.state.previewImg ? this.state.previewImg : this.props.previewImg;
    const previewCrop = this.state.cropperPreviewOpen;
    return (
      <Dialog
        actions={[
          <FlatButton
            label='Cancel'
            onTouchTap={this.cancelPreviewCrop}
          />,
          <FlatButton
            label='Crop & Save'
            primary
            style={{ color: '#5ed28f' }}
            onTouchTap={this.handlePreviewCrop}
          />,
        ]}
        modal={false}
        open={previewCrop}
        onRequestClose={this.cancelPreviewCrop}
        contentStyle={{ width: '90%' }}
      >
        <Grid id='preview-wrapper' style={{ width: '100%' }}>
          <Row>
            <Col xs={12} sm={6} md={8} lg={8}>
              <CropperJS
                ref='cropperPreview'
                src={previewImg}
                checkOrientation={false}
                viewMode={3}
                dragMode='move'
                autoCropArea={1}
                aspectRatio={this.props.aspectRatio}
                preview='#preview-wrapper .img-preview'
                style={{ height: 400, width: '100%' }}
                guides
                onCrop={this.handlePreviewCrop}
                id='avatar_preview'
              />
              <Row>
                <Col xs={12} sm={6} md={8} lg={8}>
                  Drag frame to adjust portrait.
                </Col>
                <Col xs={12} sm={6} md={4} lg={4}>
                  <RotateLeft className='rotate-img' color='#5ed28f' onClick={() => this.handlePreviewRotate(-45)} />
                  <RotateRight className='rotate-img' color='#5ed28f' onClick={() => this.handlePreviewRotate(45)} />
                </Col>
              </Row>
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              <h2>Preview:</h2>
              <div className='img-preview' />
            </Col>
          </Row>
        </Grid>
      </Dialog>
    );
  }
}

AvatarEditor.propTypes = {
  setNewImg: React.PropTypes.func,
  cancelNewImg: React.PropTypes.func,
  type: React.PropTypes.string,
  aspectRatio: React.PropTypes.number,
  previewImg: React.PropTypes.string,
};

export default AvatarEditor;
