"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "~/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import type { InputProps } from "~/components/ui/input";

export function PasswordInput({ className, ...props }: Omit<InputProps, "type">) {
  const [show, setShow] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput type={show ? "text" : "password"} className={className} {...props} />
      <InputGroupAddon align="inline-end">
        <Button
          size="icon-sm"
          variant="ghost"
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
