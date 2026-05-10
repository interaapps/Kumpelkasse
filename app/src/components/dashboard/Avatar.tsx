import { Image, StyleSheet, Text, View } from 'react-native';

type AvatarProps = {
  initials: string;
  avatarUrl?: string | null;
  size?: number;
  backgroundColor?: string;
  color?: string;
};

export function Avatar({
  initials,
  avatarUrl,
  size = 44,
  backgroundColor = '#EAF2EC',
  color = '#184C2F',
}: AvatarProps) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.initials, { color, fontSize: size * 0.38 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
  },
});
