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

type FileProps = {

};

type FileState = {
  dragging: boolean,
  file: File | null
};

class FileUploader extends React.Component<FileProps, FileState> {
  static counter = 0;
  fileUploaderInput: HTMLElement | null = null;

  constructor(props: FileProps) {
    super(props);
    this.state = { dragging: false, file: null };
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

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      this.setState({ file: event.dataTransfer.files[0] });

      let data_reader: FileReader = new FileReader();

      data_reader.onload = function (e: any) {
        let result: string = e.target.result.replace(new RegExp('data:.*\/.*,'), '');
        let decoded = new Buffer(result, 'base64').toString('ascii');
        console.log(decoded);
      };
      data_reader.readAsDataURL(event.dataTransfer.files[0]);
    }
  };

  overrideEventDefaults = (event: Event | React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  onSelectFileClick = () => {
    this.fileUploaderInput && this.fileUploaderInput.click();
  };

  onFileChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      this.setState({ file: event.target.files[0] });
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
        file={this.state.file}
        onSelectFileClick={this.onSelectFileClick}
        onDrag={this.overrideEventDefaults}
        onDragStart={this.overrideEventDefaults}
        onDragEnd={this.overrideEventDefaults}
        onDragOver={this.overrideEventDefaults}
        onDragEnter={this.dragenterListener}
        onDragLeave={this.dragleaveListener}
        onDrop={this.dropListener}
      >
      </FileUploaderPresentationalComponent>
    );
  }
}

type PresentationalProps = {
  dragging: boolean;
  file: File | null;
  onSelectFileClick: () => void;
  onDrag: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
};

export const FileUploaderPresentationalComponent: React.FunctionComponent<
  PresentationalProps
> = props => {
  const {
    dragging,
    file,
    onSelectFileClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop
  } = props;

  let uploaderClasses = "file-uploader";
  if (dragging) {
    uploaderClasses += " file-uploader--dragging";
  }

  const fileName = file ? file.name : null;

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

class App extends React.Component {
  render(){
    return (
      <div className="App">
        <header className="App-header">
          <DocumentIntegrity document={cert}/>
          <FileUploader />
        </header>
      </div>
    );
  }
}

export default App;
