import View from "./view";
import Service from "./service";
import Util from "./util";
import Clock from "./clock";

import "./style.css";

View.configureUploadBtnClick();

View.configureTestSampleBtnClick(async () => {
  const sampleVideo = await Util.getSampleVideo();
  View.setInputFileManually(sampleVideo);
});

View.configureOnFileChange((file) => {
  View.activateVideoPreview();

  Service.processVideoInBackground({
    videoFile: file,
    canvas: View.getCanvas(),
    onStart: () =>
      Clock.start((time) => View.updateElapsedTime(`Process started ${time}`)),
    onFrame(frame) {},
    onFinish: (data) => {
      Clock.stop((time) => View.updateElapsedTime(`Process took ${time.replace("ago", "")}`));

      if (data.buffers)
        View.downloadBlobAsFile(data.buffers, data.filename);
    },
  });
});
