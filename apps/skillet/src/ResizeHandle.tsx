import { useEffect, useRef, useState } from "react";
import { PanResponder, View } from "react-native";

const RESIZE_CURSOR = { cursor: "col-resize" as any };

// Web base-ui/radix resizers are DOM-only, so they can't run in React Native.
// This is the RN equivalent of the old `ResizableHandle withHandle`: a 13pt
// grab zone with an always-visible 3-dot grip that highlights while dragging.
// The parent owns the width state (clamped) exactly like the old panel sizes.
export function ResizeHandle({
  onDragStart,
  onDrag,
}: {
  onDragStart: () => void;
  onDrag: (dx: number) => void;
}): React.JSX.Element {
  const [dragging, setDragging] = useState(false);

  const onDragStartRef = useRef(onDragStart);
  const onDragRef = useRef(onDrag);

  useEffect(() => {
    onDragStartRef.current = onDragStart;
    onDragRef.current = onDrag;
  }, [onDragStart, onDrag]);

  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        setDragging(true);
        onDragStartRef.current();
      },
      onPanResponderMove: (_, gestureState) => {
        onDragRef.current(gestureState.dx);
      },
      onPanResponderRelease: () => setDragging(false),
      onPanResponderTerminate: () => setDragging(false),
    }),
  );

  const dotColor = dragging ? "bg-primary" : "bg-muted/70";

  return (
    <View
      {...pan.panHandlers}
      accessibilityHint="Drag to resize the skill list column"
      accessibilityLabel="Resize skill list"
      accessibilityRole="adjustable"
      className="h-full w-[13px] items-center justify-center"
      style={RESIZE_CURSOR}
    >
      <View className={dragging ? "h-full w-px bg-primary" : "h-full w-px bg-transparent"} />
      <View className="absolute items-center gap-[3px]">
        <View className={`h-[3px] w-[3px] rounded-full ${dotColor}`} />
        <View className={`h-[3px] w-[3px] rounded-full ${dotColor}`} />
        <View className={`h-[3px] w-[3px] rounded-full ${dotColor}`} />
      </View>
    </View>
  );
}
