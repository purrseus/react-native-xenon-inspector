import type {
  HttpHeaderReceivedCallback,
  HttpOpenCallback,
  HttpRequestHeaderCallback,
  HttpResponseCallback,
  HttpSendCallback,
} from '../types';
import { Frozen } from '../utils';
import { NetworkInterceptor } from './NetworkInterceptor';

export default abstract class HttpInterceptor extends NetworkInterceptor {
  protected openCallback: HttpOpenCallback = null;
  protected requestHeaderCallback: HttpRequestHeaderCallback = null;
  protected sendCallback: HttpSendCallback = null;
  protected headerReceivedCallback: HttpHeaderReceivedCallback = null;
  protected responseCallback: HttpResponseCallback = null;

  @Frozen()
  setOpenCallback(callback: typeof this.openCallback) {
    this.openCallback = callback;
    return this;
  }

  @Frozen()
  setRequestHeaderCallback(callback: typeof this.requestHeaderCallback) {
    this.requestHeaderCallback = callback;
    return this;
  }

  @Frozen()
  setSendCallback(callback: typeof this.sendCallback) {
    this.sendCallback = callback;
    return this;
  }

  @Frozen()
  setHeaderReceivedCallback(callback: typeof this.headerReceivedCallback) {
    this.headerReceivedCallback = callback;
    return this;
  }

  @Frozen()
  setResponseCallback(callback: typeof this.responseCallback) {
    this.responseCallback = callback;
    return this;
  }

  protected getCallbacks() {
    const openCallback = this.openCallback?.bind(this);
    const requestHeaderCallback = this.requestHeaderCallback?.bind(this);
    const sendCallback = this.sendCallback?.bind(this);
    const headerReceivedCallback = this.headerReceivedCallback?.bind(this);
    const responseCallback = this.responseCallback?.bind(this);

    return {
      openCallback,
      requestHeaderCallback,
      sendCallback,
      headerReceivedCallback,
      responseCallback,
    };
  }

  protected clearCallbacks(): void {
    this.openCallback = null;
    this.requestHeaderCallback = null;
    this.sendCallback = null;
    this.headerReceivedCallback = null;
    this.responseCallback = null;
  }
}
