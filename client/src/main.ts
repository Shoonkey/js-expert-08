import View from "./view";
import Controller from "./controller";
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
  Controller.processVideo(file);
  Clock.start((time) => View.updateElapsedTime(time));

  setTimeout(() => Clock.stop(), 5000);
});
