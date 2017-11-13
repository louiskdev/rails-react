/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import Gallery from '@common/Gallery';

import hoc from './hoc';

class BubbleGallery extends Component {

  constructor(props) {
    super(props);
  }

  refetchAlbums = () => {
    this.props.data.refetch();
  }

  render() {
    if (this.props.data.loading) {
      return <div>
        Bubble gallery loading...
      </div>;
    }

    const bubbleGallery = this.props.data.galleryWidgetAlbums;

    return (
      <Gallery {...this.props} refetchAlbums={this.refetchAlbums} galleryWidgetAlbums={bubbleGallery}/>
    );
  }
}

export default hoc(BubbleGallery);
