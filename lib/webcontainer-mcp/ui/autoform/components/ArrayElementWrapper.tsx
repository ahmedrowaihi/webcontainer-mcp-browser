import { Button } from "@/components/ui/button";
import { ArrayElementWrapperProps } from "@autoform/react";
import { TrashIcon } from "lucide-react";
import React from "react";

export const ArrayElementWrapper: React.FC<ArrayElementWrapperProps> = ({
  children,
  onRemove,
}) => {
  return (
    <div className="relative mt-2 p-4 border">
      <Button
        onClick={onRemove}
        variant="ghost"
        size="sm"
        className="top-2 right-2 absolute"
        type="button"
      >
        <TrashIcon className="w-4 h-4" />
      </Button>
      {children}
    </div>
  );
};
