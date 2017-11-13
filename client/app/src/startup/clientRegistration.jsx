/* @flow */
/* eslint-disable max-len */
import ReactOnRails from 'react-on-rails';
import MyBubblzApp from '../MyBubblzApp';

ReactOnRails.setOptions({
  traceTurbolinks: false,
});

ReactOnRails.register({
  MyBubblzApp,
});
