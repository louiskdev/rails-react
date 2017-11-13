/* @flow */
/* eslint-disable max-len */

/* import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo'
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { Router, browserHistory } from 'react-router'
import { NETWORK_INTERFACE } from '@config'
import createStore from '@store/create'
import DevTools from '@utils/DevTools'
import routes from './routes'

const networkInterface = createNetworkInterface(NETWORK_INTERFACE)
const client = new ApolloClient({ networkInterface })

const App = () => (
  <ApolloProvider store={createStore(client)} client={client}>
    <div>
      <Router history={browserHistory} routes={routes} />
      <DevTools />
    </div>
  </ApolloProvider>
)

ReactDOM.render(<App />, document.querySelector('#react-component-0'));
*/

import React from 'react';
import { match, RouterContext } from 'react-router';

import routes from './routes';

export default (props, railsContext) => {
  let error;
  let redirectLocation;
  let routeProps;

  const { location } = railsContext;

  // See https://github.com/reactjs/react-router/blob/master/docs/guides/ServerRendering.md
  match({ routes, location }, (_error, _redirectLocation, _routeProps) => {
    error = _error;
    redirectLocation = _redirectLocation;
    routeProps = _routeProps;
  });

  // This tell react_on_rails to skip server rendering any HTML. Note, client rendering
  // will handle the redirect. What's key is that we don't try to render.
  // Critical to return the Object properties to match this { error, redirectLocation }
  if (error || redirectLocation) {
    return { error, redirectLocation };
  }

  // Important that you don't do this if you are redirecting or have an error.
  return (
    <RouterContext {...routeProps} />
  );
};
