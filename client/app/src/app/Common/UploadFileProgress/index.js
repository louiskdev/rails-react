import React, { Component, PropTypes as T } from 'react';
import IconActionCheckCircle from 'material-ui/svg-icons/action/check-circle';

class UploadFileProgress extends Component {

  static propTypes = {
    filename: T.string.isRequired,
    progress: T.number,
    finished: T.bool,
  }

  render() {
    const { filename, progress, finished } = this.props;

    const containerClassNames = ['upload-progress'];
    if (finished) {
      containerClassNames.push('done');
    }
    else if (progress > 0) {
      containerClassNames.push('in-progress');
    }

    return (
      <div className={containerClassNames.join(' ')}>
        <div className='progress-content'>
          {filename}
        </div>
        {
          finished && <IconActionCheckCircle className='progress-done-icon' color='rgba(0, 0, 0, 0.3)' />
        }
        <div className='progress-bar' style={{ width: progress + '%' }} />
      </div>
    );
  }
}

export default UploadFileProgress;
