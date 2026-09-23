import { SFSymbol } from "@legend-apps/sf-symbol";
import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "./AppText";
import { useThemePalette } from "./services/theme";

export interface ErrorBannerProps {
  error: string | null | undefined;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorBanner = React.memo(function ErrorBanner({
  error,
  onDismiss,
  className = "",
}: ErrorBannerProps): React.JSX.Element | null {
  const c = useThemePalette();
  if (!error) return null;

  return (
    <View
      className={`flex-row items-center justify-between rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1.5 ${className}`}
    >
      <Text className="min-w-0 flex-1 text-[11px] font-medium text-danger" numberOfLines={2}>
        {error}
      </Text>
      {onDismiss ? (
        <Pressable
          accessibilityLabel="Dismiss error"
          accessibilityRole="button"
          className="pl-2"
          onPress={onDismiss}
        >
          <SFSymbol color={c.danger} name="xmark" size={12} />
        </Pressable>
      ) : null}
    </View>
  );
});
