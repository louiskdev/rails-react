/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import IconActionSearch from 'material-ui/svg-icons/action/search';
import debounce from 'lodash.debounce';

class SearchBubbles extends Component {

  onChange = debounce((value) => {
    const { onSearch } = this.props
    onSearch(value)
  }, 500)

  render() {
    const { onSearch } = this.props
    const searchIconStyle = {
      position: 'relative',
      top: 4,
      color: '#949494',
      width: 20,
      height: 20,
    };

    return (
      <div className="myb-search-bubbles">
        <div className="search-icon-wrapper">
          <IconActionSearch style={searchIconStyle} />
        </div>
        <div className="search-field-container">
          <input type='text' className="search-field" placeholder='Search bubbles'
            onBlur={(e) => onSearch(e.currentTarget.value)}
            onBlur={(e) => onSearch(e.currentTarget.value)}
            onKeyDown={(e) => (e.keyCode === 13 ? onSearch(e.currentTarget.value) : false )}
            onChange={(e) => {
              e.persist()
              this.onChange(e.currentTarget.value)
            }} />
        </div>
      </div>
    )
  }
}

export default SearchBubbles;
