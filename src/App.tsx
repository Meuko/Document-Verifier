import React from 'react';
import logo from './logo.svg';
import './App.css';
import { render } from '@testing-library/react';

//verify(document, {
//  network: "ropsten",
//  promisesCallback: (verificationMethods: any) => {
//    for (const verificationMethod of verificationMethods) {
//      verificationMethod.then((fragment: any)=>
//        console.log(
//          `${fragment.name} has been resolved with status ${fragment.status}`
//        )
//      );
//    }
//  }
//}).then((fragments: any) => {
//  console.log(isValid(fragments)); // output true
//});

const cert = require("./wrapped-documents/certificate-valid-1.json");
const { verify, isValid } = require("@govtechsg/oa-verify");

type IntegrityProps = {
  document: string
};
type IntegrityState = {
  document_integrity: boolean,
  document_status: boolean,
  issuer_identity: boolean
}

class DocumentIntegrity extends React.Component<IntegrityProps, IntegrityState> {
  
  constructor(props: any) {
    super(props);
    this.state = {
      document_integrity: false,
      document_status: false,
      issuer_identity: false
    };
  }

  verify_document() {
    verify(this.props.document, { network: "ropsten" }).then((fragments: any) => {
      this.setState({
        document_integrity: isValid(fragments, ["DOCUMENT_INTEGRITY"]),
        document_status: isValid(fragments, ["DOCUMENT_STATUS"]),
        issuer_identity: isValid(fragments, ["ISSUER_IDENTITY"])
      });
    });
  }

  componentWillMount() {
    this.verify_document();
  }

  render() {
    return (
      <div className="DocumentIntegrity">
        <header className="DocumentIntegrity-Header">
        <p>{(this.state.document_integrity) ? "This document has not been tampered with." : "This document has been tampered with."}</p>
        <p>{(this.state.document_status) ? "This document has been issued." : "This document has not been issued."}</p>
        <p>{(this.state.issuer_identity) ? "Document issuer has been identified" : "Document issuer has not been identified."}</p>
        </header>
      </div>
    );
  }
}

class App extends React.Component {
  render(){
    return (
      <div className="App">
        <header className="App-header">
          <DocumentIntegrity document={cert}/>
        </header>
      </div>
    );
  }
}

export default App;
