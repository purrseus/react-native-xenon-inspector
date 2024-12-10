import { StyleSheet, Text } from 'react-native';

interface NetworkRequestDetailsItemProps {
  label?: string;
  content?: string;
}

export default function NetworkRequestDetailsItem({
  label,
  content,
}: NetworkRequestDetailsItemProps) {
  return (
    <Text style={styles.text}>
      {!!label && (
        <Text style={styles.label}>
          {label}
          {': '}
        </Text>
      )}
      {content}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: '#000000',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
});