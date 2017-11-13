/* @flow */
/* eslint-disable max-len */

import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { cacheMiddleware } from './middlewares';
import * as reducers from './modules';

export default function(client: any): Function {
  const enhancer = compose(
    applyMiddleware(
      client.middleware(),
      cacheMiddleware
    ),
  );
  return createStore(
    combineReducers({
      ...reducers,
      apollo: client.reducer(),
    }),
    enhancer
  );
}
