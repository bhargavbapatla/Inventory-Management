import type { ChangeEvent } from "react";

interface TextFieldProps {
  label?: string;
  name?: string;
  type?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  containerClassName?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onTrailingIconClick?: () => void;
}

export default function TextField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  helperText,
  disabled,
  required,
  className = "",
  containerClassName = "",
  onBlur,
  leadingIcon,
  trailingIcon,
  onTrailingIconClick
}: TextFieldProps) {
  const baseInput =
    "w-full px-2 py-2 border rounded-lg bg-gray-50 text-left text-gray-900 text-sm placeholder-gray-400 border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition";

  const errorInput =
    "border-red-500 focus:ring-red-500 focus:border-red-500";
  const emailIcon = (
    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m3.5 5.5 7.893 6.036a1 1 0 0 0 1.214 0L20.5 5.5M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z" />
    </svg>
  );
  const effectiveLeadingIcon = leadingIcon ?? (type === "email" ? emailIcon : null);
  const padding = `${effectiveLeadingIcon ? "pl-9" : ""} ${trailingIcon ? "pr-9" : ""}`;
  const inputClasses = `${baseInput} ${padding} ${error ? errorInput : ""} ${className}`;

  return (
    <div className={`flex flex-col space-y-1 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-gray-700 text-left"
        >
          {label}
          {required ? <span className="text-red-600 ml-0.5">*</span> : null}
        </label>
      )}
      <div className="relative">
        {effectiveLeadingIcon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {effectiveLeadingIcon}
          </span>
        ) : null}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onBlur={onBlur}
          className={inputClasses}
        />
        {trailingIcon ? (
          onTrailingIconClick ? (
            <span
              onClick={onTrailingIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 transition"
            >
              {trailingIcon}
            </span>
          ) : (
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center z-10 px-3 text-gray-500">
              {trailingIcon}
            </span>
          )
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}
