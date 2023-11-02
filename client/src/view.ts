import Util from "./util";

class View {
  private _fileInput = document.querySelector<HTMLInputElement>("#file-input")!;
  private _uploadBtn =
    document.querySelector<HTMLButtonElement>("#upload-btn")!;
  private _uploadAnotherBtn = document.querySelector<HTMLButtonElement>("#upload-another-btn")!;
  private _testSampleBtn =
    document.querySelector<HTMLButtonElement>("#test-sample-btn")!;
  private _controlsSection =
    document.querySelector<HTMLDivElement>("#controls-section")!;
  private _videoPreviewSection = document.querySelector<HTMLDivElement>(
    "#video-preview-section"
  )!;
  private _videoPreviewCanvas =
    document.querySelector<HTMLCanvasElement>("#video-preview")!;
  private _videoPreviewFilename =
    document.querySelector<HTMLParagraphElement>("#filename")!;
  private _videoPreviewFileSize =
    document.querySelector<HTMLParagraphElement>("#file-size")!;
  private _timeElapsed =
    document.querySelector<HTMLParagraphElement>("#time-elapsed")!;

  configureUploadBtnsClick() {
    this._uploadBtn.onclick = () => this._fileInput.click();
    this._uploadAnotherBtn.onclick = () => this._fileInput.click();
  }

  configureTestSampleBtnClick(callback: () => void) {
    this._testSampleBtn.onclick = callback;
  }

  configureOnFileChange(callback: (file: File) => void) {
    this._fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const [file] = target.files as FileList;

      this._videoPreviewFilename.innerText = file.name;
      this._videoPreviewFileSize.innerText = Util.getReadableVideoSize(
        file.size
      );

      callback(file);
    };
  }

  setInputFileManually(file: File) {
    const event = new Event("change");
    Object.defineProperty(event, "target", { value: { files: [file] } });
    this._fileInput.dispatchEvent(event);
  }

  changeToVideoPreview() {
    this._controlsSection.classList.add("hidden");
    this._videoPreviewSection.classList.remove("hidden");
  }

  setVideoPreviewFrame(frame: VideoFrame) {
    const canvas = this._videoPreviewCanvas;
    const context = canvas.getContext("2d");

    if (!context)
      return;
    
    const { displayWidth, displayHeight } = frame;
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    context.drawImage(frame, 0, 0, displayWidth, displayHeight);

    // W3C Web Codecs example at
    // https://github.com/w3c/webcodecs/blob/main/samples/video-decode-display/worker.js#L20
    // does this for drawing only once per animation frame
    // (this.draw() would be the current function above)

    // let pendingFrame: VideoFrame | null = null;

    // return (frame: VideoFrame) => {
    //   const renderAnimationFrame = () => {
    //     this.draw(pendingFrame!);
    //     pendingFrame = null;
    //   };

    //   if (!pendingFrame) requestAnimationFrame(renderAnimationFrame);
    //   else pendingFrame.close();

    //   pendingFrame = frame;
    // };
  }

  updateElapsedTime(time: string) {
    this._timeElapsed.innerText = time;
  }
}

export default new View();
