import { MongoClient } from 'mongodb';

declare global {
  namespace globalThis {
    var _mongo: Promise<MongoClient>;
  }

  interface Document {
    mozFullScreenElement?: Element;
    webkitFullscreenElement?: Element;
    msFullscreenElement?: Element;
    mozCancelFullScreen?: () => void;
    webkitExitFullscreen?: () => void;
    msExitFullscreen?: () => void;
  }

  interface HTMLElement {
    mozRequestFullScreen?: () => void;
    webkitRequestFullscreen?: () => void;
    msRequestFullscreen?: () => void;
  }
}
