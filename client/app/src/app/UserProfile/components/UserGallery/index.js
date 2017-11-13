/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import Gallery from '@common/Gallery';

import hoc from './hoc';

class UserGallery extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.data.loading) {
      return <div>
        User gallery loading...
      </div>;
    }

    const userGallery = this.props.data.userGalleryAlbums;

    return (
      <Gallery {...this.props} userGalleryAlbums={userGallery}/>
    );
  }
}

export default hoc(UserGallery);
