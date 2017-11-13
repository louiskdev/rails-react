/* @flow */
/* eslint-disable max-len */

import React from 'react';
// Material UI
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
// Apollo
import { ApolloProvider } from 'react-apollo';
import ApolloClient, { createBatchingNetworkInterface, addTypename } from 'apollo-client';

import { Router, browserHistory } from 'react-router';

import ReactGA from 'react-ga';

import createStore from '@store/create';
// import DevTools from '@utils/DevTools'
import routes from './routes';

const networkInterface = createBatchingNetworkInterface({
  uri: '/graphql',
  credentials: 'same-origin',
  batchInterval: 20,
});

networkInterface.use([{
  applyBatchMiddleware(req, next) {
    if (!req.options.headers) {
      req.options.headers = {};  // Create the header object if needed.
    }
    req.options.headers.authorization = localStorage.getItem('mbubblz_token') ? localStorage.getItem('mbubblz_token') : null;
    req.options.headers['Client-ID'] = localStorage.getItem('mbubblz_client_id') ? localStorage.getItem('mbubblz_client_id') : null;
    next();
  },
},
]);

/*networkInterface.useAfter([{
  applyBatchAfterware({ response }, next) {
    if (response.status === 401) {
      console.log('Afterware got 401. Navigating away from graphql route');
      //client.store.dispatch(push('/nographql'));
    }
    next();
  },
}]);*/

const client = new ApolloClient({
  networkInterface,
  queryTransformer: addTypename,
  queryDeduplication: true,
  dataIdFromObject: (result) => {
    if (result.id && result.__typename) { // eslint-disable-line no-underscore-dangle
      return result.__typename + result.id; // eslint-disable-line no-underscore-dangle
    }
    return null;
  },
});

const muiTheme = getMuiTheme({
  fontFamily: 'Arimo, sans serif',
  palette: {
    primary1Color: '#62db95',
  },
});

// React GA
const gaCode = document.getElementsByName('ga-code')[0].content;
ReactGA.initialize(gaCode);

function logPageView() {
  ReactGA.set({ page: window.location.pathname });
  ReactGA.pageview(window.location.pathname);
}

function onRouteUpdate() {
  window.scrollTo(0, 0);
  logPageView();
}

export default (props) => {

  const AppMUI = () => (
    <MuiThemeProvider muiTheme={muiTheme}>
      <ApolloProvider store={createStore(client)} client={client} >
        <div>
          <Router onUpdate={onRouteUpdate} history={browserHistory} routes={routes} />
        </div>
      </ApolloProvider>
    </MuiThemeProvider>
  );
  return (<AppMUI />);
};

// ReactDOM.render(<App />, document.querySelector('#react-component-0'));
