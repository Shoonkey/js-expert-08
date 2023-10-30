interface OutgoingMessage {
  done: boolean;
  buffers: any[];
  filename: string;
}

export default OutgoingMessage;