import React, { useContext } from 'react';
import logo from './logo.svg';
import './App.css';
import { render } from '@testing-library/react';
import { ArrowFunction } from 'typescript';


const { verify, isValid } = require("@govtechsg/oa-verify");

type IntegrityProps = {
  certificate_contents: string
};
type IntegrityState = {
  document_integrity: boolean,
  document_status: boolean,
  issuer_identity: boolean,
  file: string | null
}

class DocumentIntegrity extends React.Component<IntegrityProps, IntegrityState> {
  myRef: React.RefObject<any>;

  constructor(props: any) {
    super(props);
    this.state = {
      document_integrity: false,
      document_status: false,
      issuer_identity: false,
      file: null 
    };
   this.myRef = React.createRef(); 
  }

  verify_document() {
    verify(JSON.parse(this.props.certificate_contents), { network: "ropsten" }).then((fragments: any) => {
      this.setState({
        document_integrity: isValid(fragments, ["DOCUMENT_INTEGRITY"]),
        document_status: isValid(fragments, ["DOCUMENT_STATUS"]),
        issuer_identity: isValid(fragments, ["ISSUER_IDENTITY"])
      });
    });
  }

  componentDidUpdate() {
    this.verify_document();
  }

  update_document(file_contents: string) {
    this.setState({
      file: file_contents
    });
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
  contentBubbler: (a: string) => void
};

type FileState = {
  dragging: boolean,
  certificate: File | null,
  certificate_contents: string | null
};

class FileUploader extends React.Component<FileProps, FileState> {
  static counter = 0;
  fileUploaderInput: HTMLElement | null = null;

  constructor(props: FileProps) {
    super(props);
    this.state = { dragging: false, certificate: null, certificate_contents: null};
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
      this.setState(
        { 
          certificate: event.dataTransfer.files[0],
        }
      );

      this.readFileContents(event.dataTransfer.files[0]);
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
      this.setState({ certificate: event.target.files[0] });
    }
  };

  readFileContents (file: File) {
      let data_reader: FileReader = new FileReader();
      let decoded_data: string | null = null;
      
       data_reader.onload = (e: any) => {
        let result: string = e.target.result.replace(new RegExp('data:.*\/.*,'), '');
        this.handleFileContents(new Buffer(result, 'base64').toString('ascii'));
      };

      data_reader.readAsDataURL(file);
  }

  handleFileContents(file_contents: string) {
    try {
      let parsed: any = JSON.parse(file_contents);
    } catch (error) {
      console.log("file isn't JSON");
      return;
    }
    this.setState({certificate_contents: file_contents});
    this.props.contentBubbler(this.state.certificate_contents || "");
  }

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
      >
      </FileUploaderPresentationalComponent>
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


const FileUploaderPresentationalComponent: React.FunctionComponent<
  PresentationalProps
> = props => {
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
        <span onChange={() => {console.log("changed temprature")}} className="file-uploader__file-name">{fileName}</span>
        <span>Drop your file here.</span>
      </div>
    </div>
  );
};

type AppState = {
  certificate: File | null,
  certificate_contents: string | null,
}


class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super({});
    this.state = { certificate: null, certificate_contents: null};
  }

  sourceContent = (input_content: string) => {
    this.setState({ certificate_contents: input_content });
  };

  render(){
    return (
      <div className="App">
        <header className="App-header">
            <DocumentIntegrity certificate_contents={this.state.certificate_contents || ""}/>
            <FileUploader contentBubbler={this.sourceContent}/>
        </header>
      </div>
    );
  }
}

export default App;
