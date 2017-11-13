import React, { Component, PropTypes as T } from 'react';
import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import {
  Editor,
  EditorState,
  RichUtils,
  convertFromRaw,
  convertToRaw,
} from 'draft-js';
import RaisedButton from 'material-ui/RaisedButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import IconEditorTitle from 'material-ui/svg-icons/editor/title';
import IconEditorFormatListBulleted from 'material-ui/svg-icons/editor/format-list-bulleted';
import IconEditorFormatListNumbered from 'material-ui/svg-icons/editor/format-list-numbered';
import IconContentRemove from 'material-ui/svg-icons/content/remove';
import IconActionCode from 'material-ui/svg-icons/action/code';
import IconEditorFormatBold from 'material-ui/svg-icons/editor/format-bold';
import IconEditorFormatItalic from 'material-ui/svg-icons/editor/format-italic';
import IconEditorFormatUnderlined from 'material-ui/svg-icons/editor/format-underlined';
import IconEditorFormatStrikethrough from 'material-ui/svg-icons/editor/format-strikethrough';
import IconContentLink from 'material-ui/svg-icons/content/link';

import { documentResult } from '@utils/queryHelpers';
import hoc from './hoc';

const tagTable = {
  'h1': 'header-one',
  'h2': 'header-two',
  'h3': 'header-three',
  'h4': 'header-four',
  'h5': 'header-five',
  'h6': 'header-six',
  'code': 'code-block',
  'blockquote': 'blockquote',
  'ul': 'unordered-list-item',
  'ol': 'ordered-list-item',
  'strong': 'BOLD',
  'em': 'ITALIC',
  'u': 'UNDERLINE',
  'strike': 'STRIKETHROUGH',
};

const inlineTags = {
  'strong': true,
  'em': true,
  'u': true,
  'strike': true,
}

class DocumentEditor extends Component {

  static contextTypes = {
    pusher: T.object,
  }

  static propTypes = {
    bubble: T.object.isRequired,
    members: T.array.isRequired,
    open: T.bool.isRequired,
    documentId: T.number,
    onRequestClose: T.func.isRequired,
  }

  state = {
    title: '',
    editorState: EditorState.createEmpty(),
    document_id: 0,
    lastSyncBlocks: {},
    docOnlineUsers: JSON.stringify({}),
  };

  constructor(props) {
    super(props);

    this.saveTimer = null;
  }

  subscribeToPusher = () => {
    const { document_id } = this.state;
    if (document_id) {
      const pusher = this.context.pusher;
      let docChannel = pusher.channels.channels['private-document-' + document_id];
      if (!docChannel) {
        docChannel = pusher.subscribe('private-document-' + document_id);
      }
      docChannel.bind('update', this.handleOnUpdateDocument)
    }
  }

  unsubscribeFromPusher = () => {
    const { document_id } = this.state;
    if (document_id) {
      const pusher = this.context.pusher;
      const docChannel = pusher.channels.channels['private-document-' + document_id];
      if (docChannel) {
        docChannel.unbind('update', this.handleOnUpdateDocument)
        pusher.unsubscribe('private-document-' + document_id)
      }
    }
  }

  subscribeToPresenceChannel = () => {
    const { document_id } = this.state;
    if (document_id && !this.docPresenceChannel) {
      const pusher = this.context.pusher;
      const docPresenceChannelName = `presence-document-${document_id}`;
      let docPresenceChannel = pusher.channels.channels[docPresenceChannelName];
      if (!docPresenceChannel) {
        docPresenceChannel = pusher.subscribe(docPresenceChannelName);
      }
      this.docPresenceChannel = docPresenceChannel;
      docPresenceChannel.bind('pusher:subscription_succeeded', this.handleDocPresenceEvent);
      docPresenceChannel.bind('pusher:member_added', this.handleDocPresenceEvent);
      docPresenceChannel.bind('pusher:member_removed', this.handleDocPresenceEvent);
    }
  }

  unsubscribeFromPresenceChannel = () => {
    const { document_id } = this.state;
    if (document_id) {
      const pusher = this.context.pusher;
      const docPresenceChannelName = `presence-document-${document_id}`;
      let docPresenceChannel = pusher.channels.channels[docPresenceChannelName];
      if (docPresenceChannel) {
        pusher.unsubscribe(docPresenceChannelName);
      }
    }
  }

  handleDocPresenceEvent = () => {
    if (!this.docPresenceChannel) {
      return;
    }
    this.setState({
      docOnlineUsers: JSON.stringify(this.docPresenceChannel.members.members),
    });
  }

  handleOnUpdateDocument = (data) => {
    const { currentUser } = this.props;
    const { title, updateData, updaterId } = data;
    if (parseInt(updaterId) !== parseInt(currentUser.id)) {
      const { editorState } = this.state;
      const updateDataParsed = JSON.parse(updateData);
      const rawContentData = convertToRaw(editorState.getCurrentContent());
      const currentBlocks = rawContentData.blocks;

      if (updateDataParsed.deleteAfter >= 0) {
        currentBlocks.splice(updateDataParsed.deleteAfter);
      }
      let inserted = 0, insertPos;
      updateDataParsed.diffs.forEach(diff => {
        insertPos = diff.after + inserted + 1;
        currentBlocks.splice.apply(currentBlocks, [insertPos, 0].concat(diff.blocks));
        inserted += diff.blocks.length;
      });

      rawContentData.blocks = currentBlocks;

      this.setState({
        title,
        editorState: EditorState.createWithContent(convertFromRaw(rawContentData)),
        lastSyncBlocks: currentBlocks,
      });
    }
  }

  handleClickBackToBubble = () => {
    const { onRequestClose } = this.props;
    if (onRequestClose) {
      onRequestClose();
    }
  }

  applyTag = (tag) => {
    const tagName = tagTable[tag];
    if (!tagName) {
      return;
    }
    const editorState = RichUtils.toggleBlockType(
      this.state.editorState,
      tagName
    );
    this.setState({
      editorState,
    });
  }

  applyInlineTag = (tag, event) => {
    event.preventDefault();
    const tagName = tagTable[tag];
    if (!tagName || !inlineTags[tag]) {
      return;
    }
    const editorState = RichUtils.toggleInlineStyle(
      this.state.editorState,
      tagName
    );
    this.setState({
      editorState,
    });
  }

  getButtonColor = (tag, activeColor, normalColor) => {
    const { editorState } = this.state;
    const currentStyle = editorState.getCurrentInlineStyle();
    return currentStyle.has(tagTable[tag]) ? activeColor : normalColor;
  }

  initSaveTimer = () => {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(this.saveDocument, 2000);
  }

  handleOnChangeTitle = (event) => {
    this.setState({
      title: event.target.value,
    });
    this.initSaveTimer();
  }

  handleOnChangeEditor = (editorState) => {
    this.initSaveTimer();
    this.setState({
      editorState
    });
  }

  compareBlocks(block1, block2) {
    return block1.type === block2.type && block1.text === block2.text;
  }

  openDocument = (documentId) => {
    this.props.client.query({
      query: gql`
        query documentQuery($document_id: ID!) {
          document(document_id: $document_id) {
            ${documentResult}
          }
        }
      `,
      variables: {
        document_id: parseInt(documentId),
      },
      forceFetch: true,
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        const { document } = data;
        const { title, content } = document;
        const contentData = JSON.parse(content);

        // Filter contentData.blocks to remove null blocks
        const _blocks = [];
        contentData.blocks.forEach(block => {
          if (block) {
            _blocks.push(block);
          }
        });
        contentData.blocks = _blocks;

        const editorState = contentData.blocks.length > 0 ?
          EditorState.createWithContent(convertFromRaw(contentData))
          :
          EditorState.createEmpty();

        this.setState({
          document_id: documentId,
          title,
          editorState,
          lastSyncBlocks: contentData.blocks.slice(0),
        }, () => {
          this.subscribeToPusher();
          this.subscribeToPresenceChannel();
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  saveDocument = () => {
    const { title, editorState } = this.state;
    const contentState = editorState.getCurrentContent();
    const { document_id } = this.state;
    if (document_id) {
      this.updateDocument();
    }
    else {
      const { bubble } = this.props;
      const document = JSON.stringify(convertToRaw(contentState));
      this.props.createDocument({
        variables: {
          bubble_id: parseInt(bubble.id),
          title,
          document,
        },
      })
      .then((graphQLResult) => {
        const { errors, data } = graphQLResult;
        if (errors) {
          if (errors[0]) {
            notify.show(errors[0].message, 'error');
          }
          else {
            notify.show(errors.message, 'error');
          }
        }
        else {
          const { status, document_id } = data.createDocument;
          if (status) {
            notify.show('Saved document', 'success');
            this.setState({
              document_id,
            });
          }
          else {
            notify.show('Failed to save the document. Retrying in 5 seconds...', 'success');
            this.initSaveTimer();
          }
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
  }

  updateDocument = () => {
    const { title, editorState, document_id, lastSyncBlocks } = this.state;
    const contentState = editorState.getCurrentContent();
    const currentBlocks = convertToRaw(contentState).blocks;

    const updateData = {
      deleteAfter: -1,
    };

    // Calculate content differences
    const diffs = [];
    let i = 0, j = 0;
    while(i < lastSyncBlocks.length && j < currentBlocks.length) {
      if (!this.compareBlocks(lastSyncBlocks[i], currentBlocks[j])) {
        const insertedBlocks = [];
        while(j < currentBlocks.length) {
          if (this.compareBlocks(lastSyncBlocks[i], currentBlocks[j])) {
            break;
          }
          insertedBlocks.push(currentBlocks[j]);
          j++;
        }
        diffs.push({
          after: i - 1,
          blocks: insertedBlocks,
        });
      }
      i++; j++;
    }
    if (i <= lastSyncBlocks.length && i > 0) {
      updateData.deleteAfter = i - 1;
    }
    else if (j < currentBlocks.length) {
      const insertedBlocks = [];
      while(j < currentBlocks.length) {
        insertedBlocks.push(currentBlocks[j]);
        j++;
      }
      diffs.push({
        after: i - 1,
        blocks: insertedBlocks,
      });
    }
    else {
      // no changes in content, only cursor/selection changes so no updates to server
      return;
    }
    updateData.diffs = diffs;

    this.props.updateDocument({
      variables: {
        document_id: parseInt(document_id),
        title,
        updateData: JSON.stringify(updateData),
      },
    })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
      }
      else {
        const { status } = data.updateDocument;
        if (status) {
          notify.show('Saved document', 'success');
          this.setState({
            lastSyncBlocks: currentBlocks.slice(),
          });
        }
        else {
          notify.show('Failed to save the document. Retrying in 5 seconds...', 'success');
          this.initSaveTimer();
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.open) {
      document.body.classList.add('document-editor-open');
      const { documentId } = nextProps;
      if (!this.props.open && documentId) {
        this.openDocument(documentId);
      } else if (!documentId) {
        this.setState({
          title: '',
          editorState: EditorState.createEmpty(),
          document_id: 0,
          lastSyncBlocks: {},
          docOnlineUsers: JSON.stringify({}),
        });
      }
    }
    else {
      document.body.classList.remove('document-editor-open');
    }
  }

  componentWillUnmount() {
    this.unsubscribeFromPusher();
    this.unsubscribeFromPresenceChannel();
  }

  render() {
    const { bubble, members, open } = this.props;
    const { title, editorState, docOnlineUsers } = this.state;

    const wrapperClasses = ['document-editor-wrapper'];
    if (!open) {
      wrapperClasses.push('closed');
    }

    const memberAvatarStyle = {
      width: 32,
      height: 32,
      marginRight: 10,
      borderRadius: 999,
      display: 'inline-block',
    };
    const iconSize = 20;
    const toolbarButtonAttr = {
      iconStyle: {
        width: iconSize,
        height: iconSize,
      },
      style: {
        width: iconSize * 2,
        height: iconSize * 2,
        padding: iconSize / 2,
      },
    };
    const blockToolbarIconColor = '#666';
    const inlineToolbarIconColor = '#fff';
    const inlineToolbarIconActiveColor = '#61d894';
    const inlineToolbarStyle = {};
    const selectionState = editorState.getSelection();
    if (selectionState.getStartOffset() === selectionState.getEndOffset() || !window.getSelection().rangeCount) {
      inlineToolbarStyle.display = 'none';
    }
    else {
      const selRects = window.getSelection().getRangeAt(0).getClientRects();
      if (selRects && selRects.length > 0) {
        const lastRect = selRects[selRects.length - 1];
        const containerRect = this.refs.editField.getBoundingClientRect();
        inlineToolbarStyle.left = lastRect.left - containerRect.left + lastRect.width / 2;
        inlineToolbarStyle.top = lastRect.top - containerRect.top + lastRect.height + 10;
      }
    }
    const _docOnlineUsers = JSON.parse(docOnlineUsers);
    const onlineMembers = [];
    for (let i = 0; i < members.length; i++) {
      if (_docOnlineUsers[members[i].node.id]) {
        onlineMembers.push(members[i]);
      }
    }

    return (
      <div className={wrapperClasses.join(' ')}>
        <div className="editor-topbar clearfix">
          {
            onlineMembers.map(member => (
              <Link to={`/u/${member.node.username}`} key={member.node.id}>
                <img src={member.node.avatar_url} style={memberAvatarStyle} />
              </Link>
            ))
          }
          <RaisedButton
            label="Back to bubble"
            primary
            backgroundColor="#5ed28f"
            style={{ float: 'right' }}
            onClick={this.handleClickBackToBubble}
            />
        </div>
        <div className="editor-body">
          <div className="content-wrapper">
            <input
              type="text"
              className="doc-title edit-field"
              placeholder="Enter a title"
              value={title}
              onChange={this.handleOnChangeTitle}
              />
            <div ref="editField" className="edit-field">
              <Editor
                className="edit-field"
                editorState={this.state.editorState}
                onChange={this.handleOnChangeEditor}
              />
              <div className="inline-toolbar" style={inlineToolbarStyle}>
                <IconButton
                  {...toolbarButtonAttr}
                  onMouseDown={event => this.applyInlineTag('strong', event)}
                  >
                  <IconEditorFormatBold color={this.getButtonColor('strong', inlineToolbarIconActiveColor, inlineToolbarIconColor)} />
                </IconButton>
                <IconButton
                  {...toolbarButtonAttr}
                  onMouseDown={event => this.applyInlineTag('em', event)}
                  >
                  <IconEditorFormatItalic color={this.getButtonColor('em', inlineToolbarIconActiveColor, inlineToolbarIconColor)} />
                </IconButton>
                <IconButton
                  {...toolbarButtonAttr}
                  onMouseDown={event => this.applyInlineTag('u', event)}
                  >
                  <IconEditorFormatUnderlined color={this.getButtonColor('u', inlineToolbarIconActiveColor, inlineToolbarIconColor)} />
                </IconButton>
                <IconButton
                  {...toolbarButtonAttr}
                  onMouseDown={event => this.applyInlineTag('strike', event)}
                  >
                  <IconEditorFormatStrikethrough color={this.getButtonColor('strike', inlineToolbarIconActiveColor, inlineToolbarIconColor)} />
                </IconButton>
              </div>
            </div>
            <div className="toolbar">
              <IconMenu
                desktop
                iconButtonElement={<IconButton {...toolbarButtonAttr}><IconEditorTitle color={blockToolbarIconColor} /></IconButton>}
              >
                <MenuItem value="1" primaryText="Headings 1" onClick={this.applyTag.bind(this, 'h1')} />
                <MenuItem value="2" primaryText="Headings 2" onClick={this.applyTag.bind(this, 'h2')} />
                <MenuItem value="3" primaryText="Headings 3" onClick={this.applyTag.bind(this, 'h3')} />
                <MenuItem value="4" primaryText="Headings 4" onClick={this.applyTag.bind(this, 'h4')} />
                <MenuItem value="5" primaryText="Headings 5" onClick={this.applyTag.bind(this, 'h5')} />
                <MenuItem value="6" primaryText="Headings 6" onClick={this.applyTag.bind(this, 'h6')} />
              </IconMenu>
              <IconButton
                {...toolbarButtonAttr}
                onClick={this.applyTag.bind(this, 'ul')}
                >
                <IconEditorFormatListBulleted color={blockToolbarIconColor} />
              </IconButton>
              <IconButton
                {...toolbarButtonAttr}
                onClick={this.applyTag.bind(this, 'ol')}
                >
                <IconEditorFormatListNumbered color={blockToolbarIconColor} />
              </IconButton>
              <IconButton
                {...toolbarButtonAttr}
                onClick={this.applyTag.bind(this, 'atomic')}
                >
                <IconContentRemove color={blockToolbarIconColor} />
              </IconButton>
              <IconButton
                {...toolbarButtonAttr}
                onClick={this.applyTag.bind(this, 'code')}
                >
                <IconActionCode color={blockToolbarIconColor} />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withApollo(hoc(DocumentEditor));
