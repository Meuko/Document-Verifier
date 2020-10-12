import React, { useEffect, useRef, useState } from "react";
import {
  getData,
  verifySignature,
  utils,
  validateSchema,
} from "@govtechsg/open-attestation";
import "./App.css";
import Viewer from "./Components/Viewer";

import { render } from "@testing-library/react";
import { Certificate } from "crypto";
import { ArrowFunction } from "typescript";

const { verify, isValid } = require("@govtechsg/oa-verify");

type IntegrityProps = {
  certificate_contents: string | null;
  certificate_file: File | null;
};
type IntegrityState = {
  document_integrity: boolean;
  document_status: boolean;
  issuer_identity: boolean;
  file: string | null;
};

class DocumentIntegrity extends React.Component<
  IntegrityProps,
  IntegrityState
> {
  static init: boolean = true;
  myRef: React.RefObject<any>;

  constructor(props: IntegrityProps) {
    super(props);
    this.state = {
      document_integrity: false,
      document_status: false,
      issuer_identity: false,
      file: null,
    };
    this.myRef = React.createRef();
  }

  verify_document() {
    verify(JSON.parse(this.props.certificate_contents!), {
      network: "ropsten",
    }).then((fragments: any) => {
      this.setState({
        document_integrity: isValid(fragments, ["DOCUMENT_INTEGRITY"]),
        document_status: isValid(fragments, ["DOCUMENT_STATUS"]),
        issuer_identity: isValid(fragments, ["ISSUER_IDENTITY"]),
      });
    });
  }

  componentDidUpdate() {
    if (this.props.certificate_contents == null) return;
    this.verify_document();
  }

  update_document(file_contents: string) {
    this.setState({
      file: file_contents,
    });
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
          <p>
            {this.state.document_integrity
              ? "This document has not been tampered with."
              : "This document has been tampered with."}
          </p>
          <p>
            {this.state.document_status
              ? "This document has been issued."
              : "This document has not been issued."}
          </p>
          <p>
            {this.state.issuer_identity
              ? "Document issuer has been identified"
              : "Document issuer has not been identified."}
          </p>
        </header>
        <header className={errorStyle}>
          <p>Please upload a valid JSON certificate.</p>
        </header>
      </div>
    );
  }
}

type FileProps = {
  contentBubbler: (a: string | null) => void;
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

    // Make sure that the uploaded file is a JSON file.
    if (event.dataTransfer.files[0].type !== "application/json") return;

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      this.setState({
        certificate: event.dataTransfer.files[0],
      });

      // At this point we should read the file's contents, but since the onLoad method is asynchronous,
      // we will have to pass a callback, which handles sending the contents to the top component.
      this.readFileContents(event.dataTransfer.files[0], () => {
        // Once the file has been read our state should be set,
        // this is the location where we should bubble up our contents
        // to the top component.
        this.handleFileContents(this.state.certificate_contents!);
        this.props.fileBubbler(this.state.certificate!);
      });
    }
  };

  readFileContents(file: File, callback: Function) {
    let data_reader: FileReader = new FileReader();

    data_reader.onload = (e: any) => {
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
      this.props.contentBubbler(this.state.certificate_contents || null);
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
        certificate={this.state.certificate}
        certificate_contents={this.state.certificate_contents}
        onSelectFileClick={this.onSelectFileClick}
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
  certificate: File | null;
  certificate_contents: string | null;
  onSelectFileClick: () => void;
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
    certificate,
    certificate_contents,
    onSelectFileClick,
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

  const fileName = certificate ? certificate.name : null;

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
        <span className="file-uploader__file-name">{fileName}</span>
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
  const [certificateContents, setCertificateContents] = useState<string | null>(
    null
  );
  const [viewSwitchIndicator, setViewSwitchIndicator] = useState<boolean>(
    false
  );

  const sourceFile = (inputFile: File | null) => {
    setCertificate(inputFile);
  };
  const sourceContent = (inputContent: string | null) => {
    setCertificateContents(inputContent);
  };

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
          <DocumentIntegrity
            certificate_file={certificate || null}
            certificate_contents={certificateContents || null}
          />
          <FileUploader
            fileBubbler={sourceFile}
            contentBubbler={sourceContent}
          />
        </div>
        <div
          className={
            "General-container " +
            (!viewSwitchIndicator ? "Hidden-container" : "")
          }
        >
          <Viewer
            document={{
              document: getData({ data: certificateContents }),
            }}
          />
        </div>
      </header>
    </div>
  );
};

export default App;
