class CanvasRenderer {
  _canvas: OffscreenCanvas;
  _context: OffscreenCanvasRenderingContext2D;

  constructor(canvas: OffscreenCanvas) {
    this._canvas = canvas;
    this._context = canvas.getContext("2d")!;
  }

  draw(frame: VideoFrame) {
    const { displayWidth, displayHeight } = frame;
    this._canvas.width = displayWidth;
    this._canvas.height = displayHeight;
    this._context.drawImage(frame, 0, 0, displayWidth, displayHeight);
    frame.close();
  }

  getRenderer() {
    let pendingFrame: VideoFrame | null = null;

    return (frame: VideoFrame) => {
      const renderAnimationFrame = () => {
        this.draw(pendingFrame!);
        pendingFrame = null;
      };

      if (!pendingFrame) requestAnimationFrame(renderAnimationFrame);
      else pendingFrame.close();

      pendingFrame = frame;
    };
  }
}

export default CanvasRenderer;
