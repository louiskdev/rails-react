/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import GalleryAlbum from '@common/GalleryAlbum';

import hoc from './hoc';

class UserGalleryAlbum extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.data.loading) {
      return <div>
        User gallery loading...
      </div>;
    }

    const userGalleryAlbum = this.props.data.userGalleryAllMedia;

    return (
      <GalleryAlbum {...this.props} userGalleryAllMedia={userGalleryAlbum}/>
    );
  }
}

export default hoc(UserGalleryAlbum);
