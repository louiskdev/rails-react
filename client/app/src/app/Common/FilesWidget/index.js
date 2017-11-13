import React, { Component, PropTypes as T } from 'react';
import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import { notify } from 'react-notify-toast';
import request from 'superagent';
import Dialog from 'material-ui/Dialog';
import IconEditorInsertDriveFile from 'material-ui/svg-icons/editor/insert-drive-file';
import IconImageTimer from 'material-ui/svg-icons/image/timer';
import IconFileCloudDownload from 'material-ui/svg-icons/file/cloud-download';
import IconFileDownload from 'material-ui/svg-icons/file/file-download';
import IconEditorModeEdit from 'material-ui/svg-icons/editor/mode-edit';
import IconActionDelete from 'material-ui/svg-icons/action/delete';

import CommonStyles from '@utils/CommonStyles';
import { uploadedFilesResult, documentResult } from '@utils/queryHelpers';
import { formatTo2Digits } from '@utils/formatter';
import UploadFile from '@common/UploadFile';
import DocumentEditor from '@common/DocumentEditor';
import hoc from './hoc';

class FilesWidget extends Component {

  static contextTypes = {
    pusher: T.object,
  }

  static propTypes = {
    bubble: T.object.isRequired,
  }

  state = {
    dataLoaded: false,
    files: [],
    documents: [],
    openUploadDialog: false,
    finishedFiles: [],
    currentFile: null,
    currentProgress: 0,
    filesToUpload: [],
    openDocumentEditor: false,
    openedDocumentId: 0,
    activeTab: 'files',
  }

  subscribeToPusher = () => {
    const { bubble } = this.props;
    const pusher = this.context.pusher;
    const channelName = `private-bubble-${bubble.permalink}`;
    let bubbleChannel = pusher.channels.channels[channelName];
    if (!bubbleChannel) {
      bubbleChannel = pusher.subscribe(channelName);
    }
    bubbleChannel.bind('file_uploaded', this.handleFileUploaded);
    bubbleChannel.bind('file_deleted', this.handleFileDeleted);
    bubbleChannel.bind('document_created', this.handleDocumentCreated);
    bubbleChannel.bind('document_updated', this.handleDocumentUpdated);
    bubbleChannel.bind('document_deleted', this.handleDocumentDeleted);
  }

  unsubscribeFromPusher = () => {
    const { bubble } = this.props;
    const pusher = this.context.pusher;
    const channelName = `private-bubble-${bubble.permalink}`;
    const bubbleChannel = pusher.channels.channels[channelName];
    if (bubbleChannel) {
      bubbleChannel.unbind('file_uploaded', this.handleFileUploaded);
      bubbleChannel.unbind('file_deleted', this.handleFileDeleted);
      bubbleChannel.unbind('document_created', this.handleDocumentCreated);
      bubbleChannel.unbind('document_updated', this.handleDocumentUpdated);
      bubbleChannel.unbind('document_deleted', this.handleDocumentDeleted);
    }
  }

  handleFileUploaded = (data) => {
    notify.show('New file uploaded!', 'success', 2000);
    const { files } = this.state;
    const _files = files.slice();
    _files.splice(0, 0, { node: data });
    this.setState({
      files: _files,
    });
  }

  handleFileDeleted = (data) => {
    const { files } = this.state;
    const { file_id } = data;
    const index = files.findIndex(file => parseInt(file.node.id) === parseInt(file_id));
    if (index >= 0) {
      const _files = files.slice();
      _files.splice(index, 1);
      this.setState({
        files: _files,
      });
    }
  }

  handleDocumentCreated = (data) => {
    notify.show('New document created!', 'success', 2000);
    const { documents } = this.state;
    const _documents = documents.slice();
    _documents.splice(0, 0, { node: data });
    this.setState({
      documents: _documents,
    });
  }

  handleDocumentUpdated = (data) => {
    const { documents } = this.state;
    const _documents = documents.slice();
    for(let i = 0; i < _documents.length; i++) {
      if (parseInt(_documents[i].node.id) === parseInt(data.id)) {
        const _node = Object.assign({}, _documents[i].node, data);
        _documents[i] = { node: _node };
        this.setState({
          documents: _documents,
        });
        break;
      }
    }
  }

  handleDocumentDeleted = (data) => {
    const { documents } = this.state;
    const { document_id } = data;
    const index = documents.findIndex(doc => parseInt(doc.node.id) === parseInt(document_id));
    if (index >= 0) {
      const _documents = documents.slice();
      _documents.splice(index, 1);
      this.setState({
        documents: _documents,
      });
    }
  }

  getData = () => {
    const { bubble } = this.props;
    this.props.client.query({
      query: gql`
        query uploadedFilesQuery($bubble_id: Int!) {
          bubbleMembers(bubble_id: $bubble_id) {
            edges {
              cursor
              node {
                id
                username
                avatar_url
              }
            }
          }
          uploadedFiles(bubble_id: $bubble_id) {
            edges {
              node {
                ${uploadedFilesResult}
              }
            }
          }
          sharedDocuments(bubble_id: $bubble_id) {
            edges {
              node {
                ${documentResult}
              }
            }
          }
        }
      `,
      variables: {
        bubble_id: parseInt(bubble.id),
      },
      forceFetch: true,
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
        this.setState({
          dataLoaded: false,
        });
      }
      else {
        const { bubbleMembers, uploadedFiles, sharedDocuments } = data;
        this.setState({
          dataLoaded: true,
          files: uploadedFiles.edges,
          documents: sharedDocuments.edges,
          members: bubbleMembers.edges,
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
      this.setState({
        dataLoaded: false,
      });
    });
  }

  handleClickUploadFile = () => {
    this.setState({
      openUploadDialog: true,
    });
  }

  handleCloseUploadFileDialog = () => {
    this.setState({
      openUploadDialog: false,
    });
  }

  newDocument = () => {
    this.setState({
      openDocumentEditor: true,
      openedDocumentId: 0,
    });
  }

  openDocument = (documentId) => {
    this.setState({
      openDocumentEditor: true,
      openedDocumentId: parseInt(documentId),
    });
  }

  deleteDocument = (documentId) => {
    const { bubble } = this.props;
    const { documents } = this.state;
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    const i = documents.findIndex(document => parseInt(document.node.id) === parseInt(documentId));
    if (i >= 0) {
      if (bubble.user_role === 'guest' && parseInt(documents[i].node.owner_id) !== parseInt(user.id)) {
        notify.show('Unauthorized to delete this document', 'error', 2000);
        return;
      }
      const _documents = documents.slice();
      _documents[i] = Object.assign({}, _documents[i], { deleting: true });
      this.setState({
        documents: _documents
      });
    }

    this.props.deleteDocument({
      variables: {
        document_id: parseInt(documentId),
      }
    })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  handleCloseDocumentEditor = () => {
    this.setState({
      openDocumentEditor: false,
    });
  }

  uploadFile = (file, callbacks) => {
    const { bubble } = this.props;
    const { onProgress, onEnd } = callbacks;
    const req = request.post('/api/v1/upload_file');
    req.set('Authorization', localStorage.getItem('mbubblz_token'));
    req.set('Client-ID', localStorage.getItem('mbubblz_client_id'));
    req.field('bubble_id', bubble.id);
    req.attach('file', file);
    req.on('progress', (e) => {
      if (onProgress) {
        onProgress(e.percent);
      }
    });
    req.end(function(err, res) {
      if (err) {
        console.log(err);
      }
      if (onEnd) {
        onEnd();
      }
    });
  }

  startUploadingFile = (file = null) => {
    const { filesToUpload } = this.state;
    if (file || filesToUpload.length > 0) {
      const fileToUpload = file ? file : filesToUpload.pop();
      this.uploadFile(fileToUpload, {
        onProgress: (percent) => {
          this.setState({
            currentProgress: percent,
          });
        },
        onEnd: () => {
          const { currentFile, finishedFiles } = this.state;
          finishedFiles.push(currentFile);
          this.setState({
            finishedFiles,
          });
          this.startUploadingFile();
        },
      });
      this.setState({
        currentFile: file,
        filesToUpload,
      });
    }
    else {
      this.setState({
        currentFile: null,
      });
    }
  }

  addFileToUpload = (file) => {
    const { currentFile } = this.state;
    if (!currentFile) {
      this.startUploadingFile(file);
    }
    else {
      const { filesToUpload } = this.state;
      filesToUpload.push(file);
      this.setState({
        filesToUpload,
      });
    }
  }

  countDownload = (file_id) => {
    this.props.countDownload({
      variables: {
        file_id: parseInt(file_id),
      }
    });
  }

  deleteFile = (file_id) => {
    const { files } = this.state;
    const i = files.findIndex(file => parseInt(file.node.id) === parseInt(file_id));
    if (i >= 0) {
      const _files = files.slice();
      _files[i] = Object.assign({}, _files[i], { deleting: true });
      this.setState({
        files: _files
      });
    }

    this.props.deleteFile({
      variables: {
        file_id: parseInt(file_id),
      }
    })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  friendlyTime = (timeString) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = parseInt(now.getTime() / 1000) - parseInt(date.getTime() / 1000);
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    else if (diffInSeconds < 3600) {
      const diffInMins = parseInt(diffInSeconds / 60);
      return `${diffInMins} minutes ago`;
    }
    else if (diffInSeconds < 3600 * 24) {
      const diffInHours = parseInt(diffInSeconds / 3600);
      return `${diffInHours} hours ago`;
    }
    else {
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours() % 12}:${formatTo2Digits(date.getMinutes())} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
    }
  }

  setUpdateTimerEverySecond = () => {
    setInterval(this.forceUpdate(), 1000);
  }

  handleOnChangeTabToFiles = () => {
    this.setState({
      activeTab: 'files',
    });
  }

  handleOnChangeTabToDocs = () => {
    this.setState({
      activeTab: 'docs',
    });
  }

  componentDidMount() {
    this.getData();
    this.setUpdateTimerEverySecond();
    this.subscribeToPusher();
  }

  componentWillUnmount() {
    this.unsubscribeFromPusher();
  }

  renderFiles = (files, styles) => {
    const { actionButtonIconStyle, deleteButtonIconStyle, metaIconStyle, downloadIconStyle } = styles;
    return (
      files.map(file => (
        <div className='file-item' key={file.node.id}>
          <div className='file-icon'>
            <IconEditorInsertDriveFile color='#bbb' style={{ width: 24 }} />
          </div>
          <div className='file-info'>
            <h3 style={{ color: '#333' }}>{file.node.filename}</h3>
            <div className='metas'>
              <span className='meta'>
                <span className='meta-icon'><IconImageTimer color='#888' style={metaIconStyle} /></span>
                <span className='meta-value'>{this.friendlyTime(file.node.created_at)}</span>
              </span>
              {/* <span className="meta">
                <span className="meta-icon"><IconFileCloudDownload color="#888" style={metaIconStyle} /></span>
                <span className="meta-value">{file.node.downloads}</span>
              </span>*/}
            </div>
          </div>
          {
            !file.deleting ?
            <div className='file-download'>
              <a
                href={file.node.url} style={actionButtonIconStyle}
                download
                target='_blank'
                onClick={this.countDownload.bind(this, file.node.id)}
                >
                <IconFileDownload color='#fff' style={downloadIconStyle} />
                Download
              </a>
              &nbsp;
              <a
                href="javascript:;"
                style={deleteButtonIconStyle}
                onClick={this.deleteFile.bind(this, file.node.id)}
                >
                <IconActionDelete color='#fff' style={downloadIconStyle} />
                Delete
              </a>
            </div>
            :
            <div className='file-download'>
              Deleting...
            </div>
          }
        </div>
      ))
    );
  }

  renderDocuments = (documents, styles) => {
    const { actionButtonIconStyle, deleteButtonIconStyle, metaIconStyle, downloadIconStyle } = styles;
    return (
      documents.map(doc => (
        <div className='file-item' key={doc.node.id}>
          <div className='file-icon'>
            <IconEditorInsertDriveFile color='#bbb' style={{ width: 24 }} />
          </div>
          <div className='file-info'>
            <h3 style={{ color: '#333' }}>{doc.node.title}</h3>
            <div className='metas'>
              <span className='meta'>
                <span className='meta-icon'><IconImageTimer color='#888' style={metaIconStyle} /></span>
                <span className='meta-value'>{this.friendlyTime(doc.node.created_at)}</span>
              </span>
            </div>
          </div>
          {
            !doc.deleting ?
            <div className='file-download'>
              <a
                href="javascript:;"
                style={actionButtonIconStyle}
                onClick={this.openDocument.bind(this, doc.node.id)}
                >
                <IconEditorModeEdit color='#fff' style={downloadIconStyle} />
                Open
              </a>
              &nbsp;
              <a
                href="javascript:;"
                style={deleteButtonIconStyle}
                onClick={this.deleteDocument.bind(this, doc.node.id)}
                >
                <IconActionDelete color='#fff' style={downloadIconStyle} />
                Delete
              </a>
            </div>
            :
            <div className='file-download'>
              Deleting...
            </div>
          }
        </div>
      ))
    );
  }

  render() {
    const { bubble, currentUser } = this.props;
    const {
      dataLoaded,
      members,
      files,
      openUploadDialog, finishedFiles, currentFile, currentProgress, filesToUpload,
      documents, openDocumentEditor, openedDocumentId,
      activeTab,
    } = this.state;
    const { containerStyle, rightButtonStyle, actionButtonIconStyle, deleteButtonIconStyle } = CommonStyles.widget;
    const metaIconStyle = {
      width: 14,
      height: 14,
    };
    const downloadIconStyle = {
      width: 16,
      height: 16,
      verticalAlign: 'middle',
      marginRight: 5,
    };

    return (
      <div style={containerStyle}>
        <DocumentEditor
          open={openDocumentEditor}
          documentId={openedDocumentId}
          onRequestClose={this.handleCloseDocumentEditor}
          bubble={bubble}
          members={dataLoaded ? members : []}
          currentUser={currentUser}
          />
        <div className='topbar-filters filter-sort-block' >
          <div className='filters'>
            <a
              className={activeTab === 'files' ? 'active' : ''}
              href='javascript:;'
              onClick={this.handleOnChangeTabToFiles}
              >Files</a>
            <a
              className={activeTab === 'docs' ? 'active' : ''}
              href='javascript:;'
              onClick={this.handleOnChangeTabToDocs}
              >Documents</a>
            {
              activeTab === 'files' ?
              <a href='javascript:;' style={rightButtonStyle} onClick={this.handleClickUploadFile}
                >Upload a new file</a>
              :
              <a href='javascript:;' style={rightButtonStyle} onClick={this.newDocument}
                >Create a new document</a>
            }
          </div>
        </div>
        <div className='files-container'>
          {
            dataLoaded ?
            (
              activeTab === 'files' ?
              this.renderFiles(files, {
                actionButtonIconStyle,
                deleteButtonIconStyle,
                metaIconStyle,
                downloadIconStyle,
              })
              :
              this.renderDocuments(documents, {
                actionButtonIconStyle,
                deleteButtonIconStyle,
                metaIconStyle,
                downloadIconStyle,
              })
            )
            :
            <div>Loading...</div>
          }
        </div>
        <Dialog
          title='Upload files'
          open={openUploadDialog}
          onRequestClose={this.handleCloseUploadFileDialog}
          autoScrollBodyContent
          contentStyle={CommonStyles.dialog.content}
          bodyStyle={CommonStyles.dialog.body}
          titleStyle={CommonStyles.dialog.title}
          >
          <UploadFile
            finishedFiles={finishedFiles}
            currentFile={currentFile}
            currentProgress={currentProgress}
            filesToUpload={filesToUpload}
            addFileToUpload={this.addFileToUpload} />
        </Dialog>
      </div>
    );
  }

}

export default withApollo(hoc(FilesWidget));
