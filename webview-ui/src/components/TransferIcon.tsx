import React, { memo } from "react";
import { useLogStream } from "../context/LogStreamContext";
import { cn } from "../lib/utils";
import IconTransferVertical from "./icons/IconTransfer";

interface TransferIconProps {
  sourceId: string;
  className?: string;
}

export const TransferIcon: React.FC<TransferIconProps> = memo(
  ({ sourceId, className }) => {
    const { hasActiveStream } = useLogStream();
    const isActive = hasActiveStream(sourceId);

    return (
      <IconTransferVertical
        className={cn(
          "transition-all duration-300",
          isActive
            ? "text-green-500 scale-110 animate-pulse"
            : "text-gray-400 opacity-60",
          className
        )}
      />
    );
  }
);
