/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import GalleryAlbum from '@common/GalleryAlbum';

import hoc from './hoc';

class BubbleGalleryAlbum extends Component {

  constructor(props) {
    super(props);
  }

  refetchAlbumMedia = () => {
    this.props.data.refetch();
  }

  render() {
    if (this.props.data.loading) {
      return <div>
        Bubble gallery loading...
      </div>;
    }

    const bubbleGalleryAlbum = this.props.data.mediaFromGallery;

    return (
      <GalleryAlbum {...this.props} refetchAlbumMedia={this.refetchAlbumMedia} mediaFromGallery={bubbleGalleryAlbum}/>
    );
  }
}

export default hoc(BubbleGalleryAlbum);
