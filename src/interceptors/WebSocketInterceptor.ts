import { NativeEventEmitter, type EmitterSubscription } from 'react-native';
import NativeWebSocketModule from 'react-native/Libraries/WebSocket/NativeWebSocketModule';
import type {
  WebSocketCloseCallback,
  WebSocketConnectCallback,
  WebSocketOnCloseCallback,
  WebSocketOnErrorCallback,
  WebSocketOnMessageCallback,
  WebSocketOnOpenCallback,
  WebSocketSendCallback,
} from '../types';
import { NetworkInterceptor } from './NetworkInterceptor';
import { Frozen } from '../utils';

const originalWebSocketConnect = NativeWebSocketModule.connect;
const originalWebSocketSend = NativeWebSocketModule.send;
const originalWebSocketSendBinary = NativeWebSocketModule.sendBinary;
const originalWebSocketClose = NativeWebSocketModule.close;

export default class WebSocketInterceptor extends NetworkInterceptor {
  static readonly instance = new WebSocketInterceptor();

  private constructor() {
    super();
  }

  private connectCallback: WebSocketConnectCallback = null;
  private sendCallback: WebSocketSendCallback = null;
  private closeCallback: WebSocketCloseCallback = null;
  private onOpenCallback: WebSocketOnOpenCallback = null;
  private onMessageCallback: WebSocketOnMessageCallback = null;
  private onErrorCallback: WebSocketOnErrorCallback = null;
  private onCloseCallback: WebSocketOnCloseCallback = null;

  @Frozen()
  setConnectCallback(callback: typeof this.connectCallback) {
    this.connectCallback = callback;
    return this;
  }

  @Frozen()
  setSendCallback(callback: typeof this.sendCallback) {
    this.sendCallback = callback;
    return this;
  }

  @Frozen()
  setCloseCallback(callback: typeof this.closeCallback) {
    this.closeCallback = callback;
    return this;
  }

  @Frozen()
  setOnOpenCallback(callback: typeof this.onOpenCallback) {
    this.onOpenCallback = callback;
    return this;
  }

  @Frozen()
  setOnMessageCallback(callback: typeof this.onMessageCallback) {
    this.onMessageCallback = callback;
    return this;
  }

  @Frozen()
  setOnErrorCallback(callback: typeof this.onErrorCallback) {
    this.onErrorCallback = callback;
    return this;
  }

  @Frozen()
  setOnCloseCallback(callback: typeof this.onCloseCallback) {
    this.onCloseCallback = callback;
    return this;
  }

  protected getCallbacks() {
    const connectCallback = this.connectCallback?.bind(this);
    const sendCallback = this.sendCallback?.bind(this);
    const closeCallback = this.closeCallback?.bind(this);
    const arrayBufferToString = this.arrayBufferToString?.bind(this);

    return {
      connectCallback,
      sendCallback,
      closeCallback,
      arrayBufferToString,
    };
  }

  protected clearCallbacks(): void {
    this.connectCallback = null;
    this.sendCallback = null;
    this.closeCallback = null;
    this.onOpenCallback = null;
    this.onMessageCallback = null;
    this.onErrorCallback = null;
    this.onCloseCallback = null;
  }

  private eventEmitter: NativeEventEmitter | null = null;
  private subscriptions: EmitterSubscription[] = [];
  private readonly timeStart: Map<number, number> = new Map();

  private arrayBufferToString(data?: string) {
    try {
      if (!data) return '(no input)';

      const byteArray = Buffer.from(data, 'base64');

      if (byteArray.length === 0) return '(empty array)';

      return `ArrayBuffer { length: ${byteArray.length}, values: [${byteArray.join(', ')}] }`;
    } catch (error) {
      return `(invalid data: ${error instanceof Error ? error.message : error})`;
    }
  }

  private registerEvents(): void {
    if (!this.eventEmitter) return;

    this.subscriptions = [
      this.eventEmitter.addListener('websocketOpen', ev => {
        const timeStart = this.timeStart.get(ev.id);
        const timeEnd = Date.now();
        const duration = timeEnd - (timeStart ?? 0);
        this.timeStart.delete(ev.id);

        this.onOpenCallback?.(ev.id, duration);
      }),
      this.eventEmitter.addListener('websocketMessage', ev => {
        this.onMessageCallback?.(
          ev.id,
          ev.type === 'binary' ? this.arrayBufferToString(ev.data) : ev.data,
        );
      }),
      this.eventEmitter.addListener('websocketClosed', ev => {
        this.onCloseCallback?.(ev.id, { code: ev.code, reason: ev.reason });
      }),
      this.eventEmitter.addListener('websocketFailed', ev => {
        this.onErrorCallback?.(ev.id, { message: ev.message });
      }),
    ];
  }

  private unregisterEvents() {
    this.subscriptions.forEach(e => e.remove());
    this.subscriptions = [];
    this.eventEmitter = null;
  }

  @Frozen()
  enableInterception(): void {
    if (this.isInterceptorEnabled) return;

    this.eventEmitter = new NativeEventEmitter(NativeWebSocketModule);

    this.registerEvents();

    const { connectCallback, sendCallback, closeCallback, arrayBufferToString } =
      this.getCallbacks();

    const timeStart = this.timeStart;
    NativeWebSocketModule.connect = function (...args) {
      connectCallback?.(...args);

      timeStart.set(args[3], Date.now());

      originalWebSocketConnect.call(this, ...args);
    };

    NativeWebSocketModule.send = function (...args) {
      sendCallback?.(...args);

      originalWebSocketSend.call(this, ...args);
    };

    NativeWebSocketModule.sendBinary = function (base64String, socketId) {
      sendCallback?.(arrayBufferToString(base64String), socketId);

      originalWebSocketSendBinary.call(this, base64String, socketId);
    };

    NativeWebSocketModule.close = function (code, reason, socketId) {
      closeCallback?.(code, reason, socketId);

      originalWebSocketClose.call(this, code, reason, socketId);
    };

    this.isInterceptorEnabled = true;
  }

  @Frozen()
  disableInterception(): void {
    if (!this.isInterceptorEnabled) return;

    this.isInterceptorEnabled = false;

    NativeWebSocketModule.connect = originalWebSocketConnect;
    NativeWebSocketModule.send = originalWebSocketSend;
    NativeWebSocketModule.sendBinary = originalWebSocketSendBinary;
    NativeWebSocketModule.close = originalWebSocketClose;

    this.clearCallbacks();

    this.unregisterEvents();
  }
}
