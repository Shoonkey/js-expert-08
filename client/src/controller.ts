class Controller {
  async processVideo(video: File) {
    console.log("Received video.");
    console.log(video)
  }
}

export default new Controller();