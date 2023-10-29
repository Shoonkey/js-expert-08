import Util from "./util";

class View {
  private _fileInput = document.querySelector<HTMLInputElement>("#file-input")!;
  private _uploadBtn =
    document.querySelector<HTMLButtonElement>("#upload-btn")!;
  private _testSampleBtn =
    document.querySelector<HTMLButtonElement>("#test-sample-btn")!;
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

  configureUploadBtnClick() {
    this._uploadBtn.onclick = () => this._fileInput.click();
  }

  configureTestSampleBtnClick(callback: () => void) {
    this._testSampleBtn.onclick = callback;
  }

  configureOnFileChange(callback: (file: File) => void) {
    this._fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const [file] = target.files as FileList;

      this._videoPreviewFilename.innerText = file.name;
      this._videoPreviewFileSize.innerText = Util.getReadableSize(file.size);

      callback(file);
    };
  }

  setInputFileManually(file: File) {
    const event = new Event("change");
    Object.defineProperty(event, "target", { value: { files: [file] } });
    this._fileInput.dispatchEvent(event);
  }

  activateVideoPreview() {
    this._videoPreviewSection.classList.remove("inactive");
    this._videoPreviewCanvas.width = 620;
    this._videoPreviewCanvas.height = 480;
  }

  updateElapsedTime(time: string) {
    this._timeElapsed.innerText = time;
  }
}

export default new View();
