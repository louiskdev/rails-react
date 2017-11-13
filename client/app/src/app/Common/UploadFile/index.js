import React, { Component, PropTypes as T } from 'react';
import { notify } from 'react-notify-toast';
import FlatButton from 'material-ui/FlatButton';
import IconFileUpload from 'material-ui/svg-icons/file/file-upload';

import UploadFileProgress from '@common/UploadFileProgress';
import CommonStyles from '@utils/CommonStyles';

class UploadFile extends Component {

  static propTypes = {
    finishedFiles: T.array,
    currentFile: T.object,
    currentProgress: T.number,
    filesToUpload: T.array,
    addFileToUpload: T.func.isRequired,
  }

  handleClickUpload = () => {
    this.refs.fileUploader.click();
  }

  handleOpenFile = (event) => {
    const { addFileToUpload } = this.props;
    if (!event.target.files || !event.target.files.length) {
      notify.show('Invalid file', 'error', 2000);
      return;
    }

    addFileToUpload(event.target.files[0]);
  }

  render() {
    const { finishedFiles, currentFile, currentProgress, filesToUpload } = this.props;

    return (
      <div className='upload-file-container'>
        {
          finishedFiles.map((file, index) => (
            <UploadFileProgress key={index} filename={file.name} finished progress={100} />
          ))
        }
        {
          currentFile && <UploadFileProgress filename={currentFile.name} progress={currentProgress} />
        }
        {
          filesToUpload.map((file, index) => (
            <UploadFileProgress key={index} filename={file.name} progress={0} />
          ))
        }
        <input type='file' ref='fileUploader' onChange={this.handleOpenFile} style={{ display: 'none' }} />
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <FlatButton
            backgroundColor='#5ed28f'
            label='Upload a new file'
            lebelStyle={{ textTransform: 'none' }}
            style={{ marginTop: 35, height: '44px', padding: '8px auto', color: '#ffffff' }}
            icon={<IconFileUpload color="#ffffff" />}
            onClick={this.handleClickUpload}
          />
        </div>
      </div>
    );
  }
}

export default UploadFile;
