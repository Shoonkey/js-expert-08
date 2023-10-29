class Util {
  async getSampleVideo() {
    const filename = "frag_bunny.mp4";
    const response = await fetch(`./${filename}`);
    return new File([await response.blob()], filename, {
      type: "video/mp4"
    });
  }

  getReadableSize(bytes: number) {
    const sizeInKB = bytes / 1024;

    if (sizeInKB > 1024) {
      const sizeInMB = bytes / (1024 * 1024);
  
      if (sizeInMB > 1024) {
        const sizeInGB = sizeInMB / 1024;
  
        if (sizeInGB > 1024) {
          const sizeInTB = sizeInGB / 1024;
          return `${sizeInTB.toFixed(2)}TB`;
        }
  
        return `${sizeInGB.toFixed(2)}GB`;
      }

      return `${sizeInMB.toFixed(2)}MB`;
    }

    return `${sizeInKB.toFixed(2)}KB`;
  }
}

export default new Util();