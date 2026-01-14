type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  fullWidth?: boolean;
};

const Button = ({ loading, children, className = '', fullWidth = true, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        ${fullWidth ? 'w-full' : 'w-auto'} inline-flex items-center justify-center rounded-lg bg-blue-600 py-2 text-sm font-medium text-white
        transition hover:bg-blue-700
        disabled:cursor-not-allowed disabled:opacity-60
        ${className}
      `}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
