/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import GalleryAllMedia from '@common/GalleryAllMedia';

import hoc from './hoc';

class BubbleGalleryAllMedia extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.data.loading) {
      return <div>
        Bubble gallery loading...
      </div>;
    }

    const bubbleGalleryAllMedia = this.props.data.mediaFromGallery;

    return (
      <GalleryAllMedia {...this.props} mediaFromGallery={bubbleGalleryAllMedia}/>
    );
  }
}

export default hoc(BubbleGalleryAllMedia);
