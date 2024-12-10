import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { URL } from 'react-native-url-polyfill';
import type { HttpRequest, NetworkType, WebSocketRequest } from '../../../types';
import { formatStatusCode } from '../../../utils';

interface NetworkPanelItemProps {
  name: HttpRequest['url'] | WebSocketRequest['uri'];
  status?: HttpRequest['status'] | WebSocketRequest['status'];
  type: NetworkType;
  onPress: () => void;
}

export default function NetworkPanelItem({ name, status, type, onPress }: NetworkPanelItemProps) {
  const requestName = useMemo(() => {
    if (!name) return '[failed]';

    try {
      const url = new URL(name);
      const suffixUrl = url.pathname + url.search;

      if (suffixUrl === '/') return url.host;
      return suffixUrl;
    } catch (error) {
      return name;
    }
  }, [name]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={[styles.column, styles.mainColumn]}>
        <Text numberOfLines={1} style={styles.text}>
          {requestName}
        </Text>
      </View>

      <View style={styles.column}>
        <Text numberOfLines={1} style={styles.text}>
          {formatStatusCode(status)}
        </Text>
      </View>

      <View style={styles.column}>
        <Text numberOfLines={1} style={styles.text}>
          {type}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  mainColumn: {
    flex: 7,
    flexShrink: 1,
  },
  column: {
    flex: 1.5,
    flexShrink: 1,
    padding: 8,
  },
  text: {
    color: '#000000',
    fontSize: 14,
  },
});