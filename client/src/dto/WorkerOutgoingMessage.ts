import EncodedFragment from "./EncodedFragment";

interface WorkerOutgoingMessage {
  done: boolean;
  videoFrame?: VideoFrame;
  videoFragment?: EncodedFragment;
} 

export default WorkerOutgoingMessage;