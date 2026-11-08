import { useEffect, useRef, useState } from "react";
import { PanResponder, View } from "react-native";

const RESIZE_CURSOR = { cursor: "col-resize" as any };
const HIT_SLOP = { left: 4, right: 4 };

// Zero-gap 1pt hairline split divider with a 9pt interactive drag zone.
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

  return (
    <View
      {...pan.panHandlers}
      accessibilityHint="Drag to resize column"
      accessibilityLabel="Resize column"
      accessibilityRole="adjustable"
      className={dragging ? "z-20 h-full w-px items-center justify-center bg-primary" : "z-10 h-full w-px items-center justify-center bg-border"}
      hitSlop={HIT_SLOP}
      style={RESIZE_CURSOR}
    >
      {dragging ? (
        <View className="h-7 w-1 rounded-full bg-primary" />
      ) : null}
    </View>
  );
}
