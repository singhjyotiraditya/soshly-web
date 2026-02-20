"use client";

import { forwardRef } from "react";

const fieldStyles =
  "w-full rounded-[14px] border border-white bg-white/20 px-4 py-3 text-[15px] text-white placeholder-white/60 outline-none transition focus:border-white/90";
const labelStyles = "mb-1.5 block text-sm font-normal text-white";

interface FormFieldProps {
  label: string;
  error?: string;
  id?: string;
}

interface InputFieldProps extends FormFieldProps, React.InputHTMLAttributes<HTMLInputElement> {
  multiline?: false;
}

interface TextAreaFieldProps
  extends FormFieldProps,
    React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  multiline: true;
}

export type FormFieldInputProps = InputFieldProps | TextAreaFieldProps;

export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldInputProps>(
  ({ label, error, id, multiline, className = "", ...rest }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    return (
      <div className="w-full">
        <label htmlFor={fieldId} className={labelStyles}>
          {label}
        </label>
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={fieldId}
            className={`${fieldStyles} min-h-[100px] resize-y ${className}`}
            {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={fieldId}
            className={`${fieldStyles} ${className}`}
            {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

FormField.displayName = "FormField";
