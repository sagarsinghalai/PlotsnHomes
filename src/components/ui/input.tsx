import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-500",
          "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
          className
        )}
        {...props}
      />
    );
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
