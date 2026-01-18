import { useAuth } from "../features/auth/authContext";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

const Button = ({
  loading,
  children,
  className = "",
  fullWidth = true,
  variant = "primary",
  ...props
}: ButtonProps) => {
  const { theme } = useAuth();

  let backgroundColor = "transparent";
  let color = theme.text;
  let border = "1px solid transparent";

  if (variant === "primary") {
    backgroundColor = theme.primary;
    color = theme.primaryText;
    border = "1px solid " + theme.primary;
  } else if (variant === "secondary") {
    backgroundColor = theme.secondary;
    color = theme.secondaryText;
    border = "1px solid " + theme.secondary;
  } else if (variant === "ghost") {
    backgroundColor = "transparent";
    color = theme.primary;
    border = "1px solid " + theme.border;
  }

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        ${fullWidth ? "w-full" : "w-auto"} inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium
        transition hover:opacity-90
        disabled:cursor-not-allowed disabled:opacity-60
        ${className}
      `}
      style={{
        backgroundColor,
        color,
        border,
      }}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

export default Button;
