import { SFSymbol } from "@legendapp/spark/ui/symbol";
import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "./AppText";
import { useThemePalette } from "./services/theme";

const CONTINUOUS_CURVE = { borderCurve: "continuous" } as const;

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
      className={`flex-row items-center justify-between rounded-[9px] border border-danger/30 bg-danger/10 px-3 py-2 ${className}`}
      style={CONTINUOUS_CURVE}
    >
      <Text className="min-w-0 flex-1 text-[11px] font-medium text-danger" numberOfLines={2}>
        {error}
      </Text>
      {onDismiss ? (
        <Pressable
          accessibilityLabel="Dismiss error"
          accessibilityRole="button"
          className="pl-2 active:opacity-70"
          onPress={onDismiss}
        >
          <SFSymbol color={c.danger} name="xmark" size={12} />
        </Pressable>
      ) : null}
    </View>
  );
});
