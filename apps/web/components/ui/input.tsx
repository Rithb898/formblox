import * as React from "react";

import { cn } from "~/lib/utils";

export type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  unstyled?: boolean;
  nativeInput?: boolean;
  size?: "sm" | "default" | "lg" | number;
};

function Input({
  className,
  type,
  unstyled,
  nativeInput: _nativeInput,
  size,
  ...props
}: InputProps) {
  const htmlSize = typeof size === "number" ? size : undefined;
  return (
    <input
      type={type}
      size={htmlSize}
      data-size={size}
      data-slot="input"
      className={cn(
        !unstyled &&
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        !unstyled &&
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        !unstyled &&
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
