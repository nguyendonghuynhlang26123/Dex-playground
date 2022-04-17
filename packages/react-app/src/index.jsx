import './assets/styles/index.css';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { DAppProvider, Rinkeby } from '@usedapp/core';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import { networkConfig } from './common/config';
import { BrowserRouter } from 'react-router-dom';

// This is the official Uniswap v2 subgraph. You can replace it with your own, if you need to.
// See all subgraphs: https://thegraph.com/explorer/
const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
});

ReactDOM.render(
  <React.StrictMode>
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
  </React.StrictMode>,
  document.getElementById('root')
);
