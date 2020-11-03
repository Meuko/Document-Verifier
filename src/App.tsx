import React, { useEffect, useRef, useState } from "react";
import { getData } from "@govtechsg/open-attestation";
import "./App.css";
import "font-awesome/css/font-awesome.css";

import Viewer from "./Components/Viewer";
import { servicesVersion } from "typescript";

import { encryptString, decryptString } from "@govtechsg/oa-encryption";

const { verify, isValid } = require("@govtechsg/oa-verify");

type IntegrityProps = {
  certificate_contents: string;
  certificate_resetter: Function;
}

type IntegrityState = {
  document_integrity: boolean;
  document_status: boolean;
  issuer_identity: boolean;
};

class DocumentIntegrity extends React.Component<IntegrityProps, IntegrityState> {
  static init: boolean = true;
  myRef: React.RefObject<any>;

  constructor(props: IntegrityProps) {
    super(props);
    this.state = {
      document_integrity: false,
      document_status: false,
      issuer_identity: false,
    };
    this.myRef = React.createRef();
  }

  verify_document() {
    verify(JSON.parse(this.props.certificate_contents!), {
      network: "ropsten",
    }).then((fragments: any) => {
      // As I understand this, once a document is verified, multiple fragments
      // are returned; each referring to a specific set of "validity" of the d-
      // ocument in question. Practically speaking, we're only concerned with
      // document_integrity. document_status is used to check whether or not
      // an issuing party has actually issued or revoked the document. issuer_
      // identity actually checks whether or not the issuer's identity is valid.
      // https://openattestation.com/docs/component/oa-verify 
      this.setState({
        document_integrity: isValid(fragments, ["DOCUMENT_INTEGRITY"]),
        document_status: isValid(fragments, ["DOCUMENT_STATUS"]),
        issuer_identity: isValid(fragments, ["ISSUER_IDENTITY"]),
      });
    });

    const encrypted_document = encryptString(this.props.certificate_contents);
    //console.log("Encrypted document", encrypted_document);
    const decrypted_document = decryptString(encrypted_document);
    //console.log("Decrypted document", decrypted_document);
    const clean_document = getData({data: decrypted_document});
  }

  componentDidMount() {
    if (this.props.certificate_contents == null) return;
    // On mounting, if a document is available, verify_document
    // to populate our state.
    this.verify_document();
  }

  render() {
    let regularStyle = "DocumentIntegrity-Header";
    let errorStyle = "DocumentIntegrity-Header-Invalid";
    if (this.props.certificate_contents == null) {
      regularStyle += " hide";
    } else {
      errorStyle += " hide";
    }

    return (
      <div className="DocumentIntegrity">
        <header className={regularStyle}>
          <div className="StatusContainer">
            {this.state.document_integrity ? (
              <i className="fa fa-check-circle"> Not tampered with</i>
            ) : (
              <i className="fa fa-times-circle"> Not tampered with</i>
            )}
            {this.state.document_status ? (
              <i className="fa fa-check-circle"> Has been issued</i>
            ) : (
              <i className="fa fa-times-circle"> Has been issued</i>
            )}
            {this.state.issuer_identity ? (
              <i className="fa fa-check-circle"> Issuer identified</i>
            ) : (
              <i className="fa fa-times-circle"> Issuer identified</i>
            )}
          <button onClick={(e: any) => {this.props.certificate_resetter()}}>Verify another document</button>
          </div>
        </header>
        <header className={errorStyle}>
          <p>Please upload a valid JSON certificate.</p>
        </header>
      </div>
    );
  }
}

type FileProps = {
  contentBubbler: (a: string) => void;
  fileBubbler: (a: File) => void;
};

type FileState = {
  dragging: boolean;
  certificate: File | null;
  certificate_contents: string | null;
};

class FileUploader extends React.Component<FileProps, FileState> {
  static counter = 0;
  fileUploaderInput: HTMLElement | null = null;

  constructor(props: FileProps) {
    super(props);
    this.state = {
      dragging: false,
      certificate: null,
      certificate_contents: null,
    };
  }

  dragEventCounter = 0;
  dragenterListener = (event: React.DragEvent<HTMLDivElement>) => {
    this.overrideEventDefaults(event);
    this.dragEventCounter++;
    if (event.dataTransfer.items && event.dataTransfer.items[0]) {
      this.setState({ dragging: true });
    } else if (
      event.dataTransfer.types &&
      event.dataTransfer.types[0] === "Files"
    ) {
      // This block handles support for IE - if you're not worried about
      // that, you can omit this
      this.setState({ dragging: true });
    }
  };

  dragleaveListener = (event: React.DragEvent<HTMLDivElement>) => {
    this.overrideEventDefaults(event);
    this.dragEventCounter--;

    if (this.dragEventCounter === 0) {
      this.setState({ dragging: false });
    }
  };

  dropListener = (event: React.DragEvent<HTMLDivElement>) => {
    this.overrideEventDefaults(event);
    this.dragEventCounter = 0;
    this.setState({ dragging: false });
    // File drop happens here.

    // Make sure that the uploaded file is a JSON file.
    if (event.dataTransfer.files[0].type !== "application/json") return;

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      this.setState({
        certificate: event.dataTransfer.files[0],
      });

      // At this point we should read the file's contents, but since 
      // the onLoad method is asynchronous, we will have to pass a c-
      // allback, which handles sending the contents to the top comp-
      // onent. This is also called "bubbling" up the content.
      this.readFileContents(event.dataTransfer.files[0], () => {
        // Once the file has been read our state should be set,
        // this is the location where we should bubble up our contents
        // to the top component.
        if (
          this.state.certificate_contents !== null &&
          this.state.certificate !== null
        ) {
          this.handleFileContents(this.state.certificate_contents);
          this.props.fileBubbler(this.state.certificate);
        }
      });
    }
  };

  readFileContents(file: File, callback: Function) {
    let data_reader: FileReader = new FileReader();
    // Note that here we're simply stating what should happen once
    // onload happens, this doesn't happen on program load, only once
    // our reader is fed a file. This is why we're using a callback.
    // to handle our content bubbling and state changes.
    data_reader.onload = (e: any) => {
      // Since we're working with base64 format we have to run this
      // expression, all it does is replace the start of our data
      // with an empty string, which enables us to decode it.
      let result: string = e.target.result.replace(
        new RegExp("data:.*/.*,"),
        ""
      );
      this.setState({
        certificate_contents: new Buffer(result, "base64").toString("ascii"),
      });
      callback();
    };
    data_reader.readAsDataURL(file);
  }

  handleFileContents(file_contents: string) {
    try {
      // If parsing the JSON completes succesfully, it means we have a valid piece of JSON.
      let parsed_file_contents = JSON.parse(file_contents);
      // TODO::(Hamza) - Confirm that this is a valid OAV2WRAPPED document. OA's function as
      // of now doesn't work.
      // https://github.com/Open-Attestation/open-attestation/issues/132

      this.props.contentBubbler(this.state.certificate_contents!);
    } catch (error) {
      // File couldn't be parsed, invalid JSON, show an error.
      console.log("ERROR : JSON couldn't be parsed.");
    }
  }

  overrideEventDefaults = (event: Event | React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  onSelectFileClick = () => {
    this.fileUploaderInput && this.fileUploaderInput.click();
  };

  onFileChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      this.setState({ certificate: event.target.files[0] });
    }
  };

  componentDidMount() {
    window.addEventListener("dragover", (event: Event) => {
      this.overrideEventDefaults(event);
    });
    window.addEventListener("drop", (event: Event) => {
      this.overrideEventDefaults(event);
    });
  }

  componentWillUnmount() {
    window.removeEventListener("dragover", this.overrideEventDefaults);
    window.removeEventListener("drop", this.overrideEventDefaults);
  }

  render() {
    return (
      <FileUploaderPresentationalComponent
        dragging={this.state.dragging}
        onDrag={this.overrideEventDefaults}
        onDragStart={this.overrideEventDefaults}
        onDragEnd={this.overrideEventDefaults}
        onDragOver={this.overrideEventDefaults}
        onDragEnter={this.dragenterListener}
        onDragLeave={this.dragleaveListener}
        onDrop={this.dropListener}
      ></FileUploaderPresentationalComponent>
    );
  }
}

type PresentationalProps = {
  dragging: boolean;
  onDrag: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
};

const FileUploaderPresentationalComponent: React.FunctionComponent<PresentationalProps> = (
  props
) => {
  const {
    dragging,
    onDrag,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
  } = props;


  let uploaderClasses = "file-uploader";
  if (dragging) {
    uploaderClasses += " file-uploader--dragging";
  }

  return (
    <div
      className={uploaderClasses}
      onDrag={onDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="file-uploader__contents">
        <span>Drop your file here.</span>
      </div>
    </div>
  );
};

type AppState = {
  certificate: File | null;
  certificate_contents: string | null;
};

const App: React.FunctionComponent = () => {
  const [certificate, setCertificate] = useState<File | null>(null);
  const [certificateContents, setCertificateContents] = useState<string>(
    // Placeholder file.
    require("./WrappedDocuments/certificate-valid-1.json")
  );
  const [viewSwitchIndicator, setViewSwitchIndicator] = useState<boolean>(
    false
  );

  const sourceFile = (inputFile: File | null) => {
    setCertificate(inputFile);
  };
  const sourceContent = (inputContent: string) => {
    setCertificateContents(inputContent);
  };
  const resetState = () => {
    // This function is used when a certificate has been displayed and the user wants to
    // return to the first view to try and verify another certificate.
    setViewSwitchIndicator(false);
    setCertificate(null);
    setCertificateContents("");
  }

  // Used to skip the initial run of useEffect().
  const Initial: React.MutableRefObject<boolean> = useRef(true);

  useEffect(() => {
    if (Initial.current) {
      Initial.current = false;
      return;
    }

    if (certificate !== null) {
      // Certificate has been changed, time to load the document viewer.
      setViewSwitchIndicator(true);
    }
  }, [certificate, certificateContents]);

  return (
    <div className="App">
      <header className="General-container Header-container">
        <div
          className={
            "General-container " +
            (viewSwitchIndicator ? "Hidden-container" : "")
          }
        >
          <FileUploader
            fileBubbler={sourceFile}
            contentBubbler={sourceContent}
          />
        </div>
        <div
          className={
            "General-container " +
            (!viewSwitchIndicator ? "Hidden-container" : "test-flex")
          }
        >
          {viewSwitchIndicator ? (
            <>
              <Viewer
                document={{
                  name: "Current File",
                  document: getData(JSON.parse(certificateContents)),
                }}
              />
              <DocumentIntegrity 
                certificate_contents={certificateContents}
                certificate_resetter={resetState} 
              />
            </>
          ) : (
            <div></div>
          )}
        </div>
      </header>
    </div>
  );
};

export default App;
