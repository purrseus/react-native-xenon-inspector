import { ScrollView, StyleSheet, Text } from 'react-native';
import type { LogMessage } from '../../../types';
import { formatLogMessage } from '../../../utils';

interface LogMessageDetailsProps {
  item: LogMessage;
}

export default function LogMessageDetails({ item }: LogMessageDetailsProps) {
  return (
    <ScrollView style={styles.container}>
      <Text>{formatLogMessage(item.type, item.values)}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#888888',
  },
});
