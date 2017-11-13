import React from 'react';

const RootApp = React.createClass({

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }

});

export default RootApp;
