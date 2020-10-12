import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Viewer from './Components/Viewer';
import * as serviceWorker from './serviceWorker';
import { getData } from '@govtechsg/open-attestation';

//ReactDOM.render(
  //<React.StrictMode>
    //<Viewer document={
        //{
        //document: getData(require("./WrappedDocuments/certificate-valid-1.json"))
        //}
    //}
    ///>
  //</React.StrictMode>,
  //document.getElementById('root')
//);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
