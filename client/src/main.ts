import View from "./view";
import Service from "./service";
import Util from "./util";
import Clock from "./clock";

import "./style.css";

View.configureUploadBtnsClick();

View.configureTestSampleBtnClick(async () => {
  const sampleVideo = await Util.getSampleVideo();
  View.setInputFileManually(sampleVideo);
});

View.configureOnFileChange((file) => {
  View.changeToVideoPreview();

  Service.processVideoInBackground({
    videoFile: file,
    onStart() {
      Clock.start((time) => View.updateElapsedTime(`Process started ${time}`));
    },
    onFrame(frame) {
      View.setVideoPreviewFrame(frame);
    },
    onFinish() {
      Clock.stop((time) =>
        View.updateElapsedTime(`Process took ${time.replace("ago", "")}`)
      );
    },
    async onEncodedFragment({ fragment, type, segmentNumber }) {
      const filenameWithoutExtension = file.name.split("/").pop()!.replace(".mp4", "");

      await Service.uploadFile({
        filename: `${filenameWithoutExtension}-144p.${segmentNumber}.${type}`,
        fileBuffer: fragment
      });
    },
  });
});
