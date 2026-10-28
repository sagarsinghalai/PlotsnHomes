"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type, ...props }, ref) {
    const [show, setShow] = useState(false);
    const isPassword = type === "password";

    const base = cn(
      "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-500",
      "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
      isPassword && "pr-11",
      className
    );

    if (isPassword) {
      // A password field gets a show/hide eye toggle so the entered value can be
      // revealed. Toggling only swaps the input type — the value is never exposed
      // elsewhere.
      return (
        <div className="relative">
          <input ref={ref} type={show ? "text" : "password"} className={base} {...props} />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            title={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      );
    }

    return <input ref={ref} type={type} className={base} {...props} />;
  }
);

export const Label = ({
  children,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) => (
  <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)}>
    {children}
  </label>
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-500",
        "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 min-h-[120px]",
        className
      )}
      {...props}
    />
  );
});
