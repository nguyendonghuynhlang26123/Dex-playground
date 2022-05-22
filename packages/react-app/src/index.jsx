import './assets/styles/index.css';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { DAppProvider, Rinkeby } from '@usedapp/core';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import { networkConfig } from './common/config';
import { BrowserRouter } from 'react-router-dom';
import store from './store';

// This is the official Uniswap v2 subgraph. You can replace it with your own, if you need to.
// See all subgraphs: https://thegraph.com/explorer/
const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'https://api.thegraph.com/subgraphs/name/nguyendonghuynhlang26123/limit-order-rinkeby',
});
console.log(networkConfig);
ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <DAppProvider config={networkConfig}>
        <ApolloProvider client={client}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </ApolloProvider>
      </DAppProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
