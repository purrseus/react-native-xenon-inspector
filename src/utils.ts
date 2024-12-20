import type { HttpRequest } from './types';

export const limitChar = (value: any, limit = 5000) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value ?? '');

  return stringValue.length > limit
    ? `${stringValue.slice(0, limit)}\n---LIMITED TO ${limit} CHARACTERS---`
    : stringValue;
};

export const getHttpInterceptorId = () => {
  const timestamp = Date.now().toString(36);
  const randomNum = Math.random().toString(36).substring(2, 10);
  return timestamp + randomNum;
};

export const keyValueToString = (key: string, value: any): string =>
  `${key}: ${limitChar(value)}\n`;

export const formatRequestMethod = (method?: string) => method ?? 'GET';

export const formatRequestDuration = (duration?: number) =>
  duration ? `${duration}ms` : 'pending';

export const formatRequestStatusCode = (statusCode?: number) => `${statusCode ?? 'pending'}`;

export const formatLogMessage = (type: string, values: any[]) => {
  const message: string = values.reduce((pre, cur, index, array) => {
    const isLastItem = index === array.length - 1;

    return pre + limitChar(cur) + (isLastItem ? '' : ', ');
  }, '');

  return `${type.toUpperCase()}: ${message}`;
};

export const convertToCurl = (
  method: HttpRequest['method'],
  url: HttpRequest['url'],
  headers: HttpRequest['requestHeaders'],
  body: HttpRequest['body'],
) => {
  let curlCommand = `curl -X ${method.toUpperCase()} "${url}"`;

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      curlCommand += ` -H "${key}: ${value}"`;
    }
  }

  if (body) {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    curlCommand += ` -d '${bodyString}'`;
  }

  return curlCommand;
};

export function Frozen() {
  return function (_target: Object) {
    const [_, __, descriptor] = arguments as unknown as [Object, string, PropertyDescriptor];
    descriptor.configurable = false;
    descriptor.writable = false;
  };
}
