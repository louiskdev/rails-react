/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import ReactGA from 'react-ga';
import InputField from '@common/InputField';
// import ReactQuill from 'react-quill';
import hoc from './hoc';

class CreatePost extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showRichEditor: false,
      editorContent: '',
    };
  }

  createPost = (vars) => {
    const self = this;
    vars.title = '';
    vars.blog_id = this.props.blogId;

    this.props.submit({ variables: vars })
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
        self.props.updateFeed(data);
        // self.props.updateFeed();
        ReactGA.event({
          category: 'Blog',
          action: 'Wrote a post',
        });
      }

    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  onTextChange = (value) => {
    this.setState({ editorContent: value });
  }

  changeEditor = () => {
    this.setState({
      showRichEditor: !this.state.showRichEditor,
    });
  }

  render() {
    const self = this;

    const _quillModules = {
      toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean'],
      ],
        /* ... other modules */
    };

    const _quillFormats = [
      'header',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'list', 'bullet', 'indent',
      'link', 'image',
    ];

    return (
      <div className="new-message-box-wrapper" style={{ position: 'relative' }}>
      {/* }<a onClick={this.changeEditor} className="toggle-editor" style={{position: 'absolute', right: 0, top: '-24px'}}>Toggle Editor</a>*/}
      <a className='toggle-editor' style={{ position: 'absolute', right: 0, top: '-24px', color: '#ddd' }}>Toggle Editor</a>
       {/* this.state.showRichEditor ?
         <ReactQuill theme='snow'
                     modules={_quillModules}
                     toolbar={false} // Let Quill manage toolbar
                     >
              <div key="editor"
                ref="editor"
                className="quill-contents border_solid_top"
                onChange={this.onTextChange}
                dangerouslySetInnerHTML={{__html:this.state.editorContent}} />
         </ReactQuill>
         :
         null
       */}
       <InputField key='editor'
         ref='editor'
         className='quill-contents border_solid_top'
         type='note'
         rows={1}
         submitMessage={this.createPost} />
     </div>
    );
  }
}

export default hoc(CreatePost);
