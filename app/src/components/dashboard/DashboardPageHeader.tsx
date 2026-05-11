import { StyleSheet, View } from 'react-native';

export const DASHBOARD_PAGE_SIDE_PADDING = 20;
export const DASHBOARD_TOPBAR_SIDE_PADDING = 22;
export const DASHBOARD_TOPBAR_TOP_PADDING = 8;

export function DashboardPageHeader({
  children,
  bleedHorizontal = 0,
}: {
  children: React.ReactNode;
  bleedHorizontal?: number;
}) {
  return (
    <View
      style={[
        styles.container,
        {
          marginHorizontal: bleedHorizontal ? -bleedHorizontal : 0,
          paddingHorizontal: DASHBOARD_TOPBAR_SIDE_PADDING,
          paddingTop: DASHBOARD_TOPBAR_TOP_PADDING,
        },
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
