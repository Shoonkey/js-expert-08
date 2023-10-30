class Service {
  _url: string;

  constructor(url: string) {
    this._url = url;
  }

  async uploadFile({
    filename,
    fileBuffer,
  }: {
    filename: string;
    fileBuffer: Blob;
  }) {
    const formData = new FormData();
    formData.append(filename, fileBuffer);
    console.log("uploading file", filename);

    const response = await fetch(this._url, {
      method: "POST",
      body: formData,
    });

    console.assert(response.ok, "response is not ok", response);
    return response;
  }
}

export default Service;
