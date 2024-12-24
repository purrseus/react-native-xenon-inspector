import { useCallback, useEffect, useState } from 'react';
import { useImmer } from 'use-immer';
import { NETWORK_REQUEST_HEADER } from '../constants';
import { FetchInterceptor, WebSocketInterceptor, XHRInterceptor } from '../interceptors';
import {
  NetworkType,
  type HttpHandlers,
  type HttpRequest,
  type ID,
  type WebSocketHandlers,
  type WebSocketRequest,
} from '../types';
import { keyValueToString } from '../utils';

interface NetworkInterceptorParams {
  autoEnabled: boolean;
}

type NetworkRequests<T> = Map<NonNullable<ID>, T>;

const initRequests = new Map<NonNullable<ID>, HttpRequest & WebSocketRequest>();

export default function useNetworkInterceptor({ autoEnabled }: NetworkInterceptorParams) {
  const [isInterceptorEnabled, setIsInterceptorEnabled] = useState(autoEnabled);

  const [networkRequests, setNetworkRequests] = useImmer(initRequests);

  const isEnabled = () =>
    XHRInterceptor.instance.isInterceptorEnabled &&
    FetchInterceptor.instance.isInterceptorEnabled &&
    WebSocketInterceptor.instance.isInterceptorEnabled;

  const clearAllNetworkRequests = () => {
    setNetworkRequests(initRequests);
  };

  const enableHttpInterceptions = useCallback(() => {
    const openCallback: HttpHandlers['open'] = (id, type, method, url) => {
      if (!id) return;

      setNetworkRequests((draft: NetworkRequests<HttpRequest>) => {
        draft.set(id, { type, method, url });
      });
    };

    const requestHeaderCallback: HttpHandlers['requestHeader'] = (id, header, value) => {
      if (!id) return;

      setNetworkRequests((draft: NetworkRequests<HttpRequest>) => {
        if (!draft.get(id)) return draft;

        const currentHeaderLine = keyValueToString(header, value);

        const fetchRequestHeaderLineRegex = RegExp(
          keyValueToString(NETWORK_REQUEST_HEADER, NetworkType.Fetch),
          'gi',
        );

        const isFetchInXHR =
          draft.get(id)!.type === NetworkType.XHR &&
          !!currentHeaderLine.match(fetchRequestHeaderLineRegex);

        if (isFetchInXHR) {
          draft.delete(id);
        } else {
          draft.get(id)!.requestHeadersString ??= '';
          draft.get(id)!.requestHeadersString += currentHeaderLine;
          draft.get(id)!.requestHeaders ??= {};
          draft.get(id)!.requestHeaders![header] = value;
        }
      });
    };

    const sendCallback: HttpHandlers['send'] = (id, data) => {
      if (!id) return;

      setNetworkRequests((draft: NetworkRequests<HttpRequest>) => {
        if (!draft.get(id)) return draft;

        draft.get(id)!.body = data;
      });
    };

    const headerReceivedCallback: HttpHandlers['headerReceived'] = (
      id,
      responseContentType,
      responseSize,
      responseHeaders,
    ) => {
      if (!id) return;

      setNetworkRequests((draft: NetworkRequests<HttpRequest>) => {
        if (!draft.get(id)) return draft;

        draft.get(id)!.responseContentType = responseContentType;
        draft.get(id)!.responseSize = responseSize;
        draft.get(id)!.responseHeaders = responseHeaders;
      });
    };

    const responseCallback: HttpHandlers['response'] = (
      id,
      status,
      timeout,
      duration,
      response,
      responseURL,
      responseType,
    ) => {
      if (!id) return;

      setNetworkRequests((draft: NetworkRequests<HttpRequest>) => {
        if (!draft.get(id)) return draft;

        draft.get(id)!.status = status;
        draft.get(id)!.timeout = timeout;
        draft.get(id)!.duration = duration;
        draft.get(id)!.response = response;
        if (responseURL) draft.get(id)!.url = responseURL;
        draft.get(id)!.responseType = responseType;
      });
    };

    XHRInterceptor.instance
      .set('open', openCallback)
      .set('requestHeader', requestHeaderCallback)
      .set('send', sendCallback)
      .set('headerReceived', headerReceivedCallback)
      .set('response', responseCallback)
      .enableInterception();

    FetchInterceptor.instance
      .set('open', openCallback)
      .set('requestHeader', requestHeaderCallback)
      .set('send', sendCallback)
      .set('headerReceived', headerReceivedCallback)
      .set('response', responseCallback)
      .enableInterception();
  }, [setNetworkRequests]);

  const enableWebSocketInterception = useCallback(() => {
    const connectCallback: WebSocketHandlers['connect'] = (url, protocols, options, socketId) => {
      if (typeof socketId !== 'number') return;

      setNetworkRequests((draft: NetworkRequests<WebSocketRequest>) => {
        draft.set(`${socketId}`, {
          url,
          type: NetworkType.WS,
          protocols,
          options,
        });
      });
    };

    const sendCallback: WebSocketHandlers['send'] = (data, socketId) => {
      if (typeof socketId !== 'number') return;

      setNetworkRequests((draft: NetworkRequests<WebSocketRequest>) => {
        if (!draft.get(`${socketId}`)) return draft;

        draft.get(`${socketId}`)!.messages ??= '';
        draft.get(`${socketId}`)!.messages += keyValueToString('SENT', data);
      });
    };

    const closeCallback: WebSocketHandlers['close'] = (code, reason, socketId) => {
      if (typeof socketId !== 'number') return;

      setNetworkRequests((draft: NetworkRequests<WebSocketRequest>) => {
        if (!draft.get(`${socketId}`)) return draft;

        draft.get(`${socketId}`)!.status = code;
        draft.get(`${socketId}`)!.closeReason = reason;
      });
    };

    const onOpenCallback: WebSocketHandlers['onOpen'] = (socketId, duration) => {
      if (typeof socketId !== 'number') return;

      setNetworkRequests((draft: NetworkRequests<WebSocketRequest>) => {
        if (!draft.get(`${socketId}`)) return draft;

        draft.get(`${socketId}`)!.duration = duration;
      });
    };

    const onMessageCallback: WebSocketHandlers['onMessage'] = (socketId, message) => {
      if (typeof socketId !== 'number') return;

      setNetworkRequests((draft: NetworkRequests<WebSocketRequest>) => {
        if (!draft.get(`${socketId}`)) return draft;

        draft.get(`${socketId}`)!.messages ??= '';
        draft.get(`${socketId}`)!.messages += keyValueToString('RECEIVED', message);
      });
    };

    const onErrorCallback: WebSocketHandlers['onError'] = (socketId, data) => {
      if (typeof socketId !== 'number') return;

      setNetworkRequests((draft: NetworkRequests<WebSocketRequest>) => {
        if (!draft.get(`${socketId}`)) return draft;

        draft.get(`${socketId}`)!.serverError = data;
      });
    };

    const onCloseCallback: WebSocketHandlers['onClose'] = (socketId, data) => {
      if (typeof socketId !== 'number') return;

      setNetworkRequests((draft: NetworkRequests<WebSocketRequest>) => {
        if (!draft.get(`${socketId}`)) return draft;

        draft.get(`${socketId}`)!.serverClose = data;
      });
    };

    WebSocketInterceptor.instance
      .set('connect', connectCallback)
      .set('send', sendCallback)
      .set('close', closeCallback)
      .set('onOpen', onOpenCallback)
      .set('onMessage', onMessageCallback)
      .set('onError', onErrorCallback)
      .set('onClose', onCloseCallback)
      .enableInterception();
  }, [setNetworkRequests]);

  const enableInterception = useCallback(() => {
    if (isEnabled()) return;

    enableHttpInterceptions();
    enableWebSocketInterception();
    setIsInterceptorEnabled(true);
  }, [enableHttpInterceptions, enableWebSocketInterception]);

  const disableInterception = useCallback(() => {
    if (!isEnabled()) return;

    XHRInterceptor.instance.disableInterception();
    FetchInterceptor.instance.disableInterception();
    WebSocketInterceptor.instance.disableInterception();
    setIsInterceptorEnabled(false);
  }, []);

  useEffect(() => {
    if (autoEnabled) enableInterception();

    if (autoEnabled) return disableInterception;
  }, [autoEnabled, disableInterception, enableInterception]);

  return {
    isInterceptorEnabled,
    enableInterception,
    disableInterception,
    clearAllNetworkRequests,
    networkRequests,
  };
}
