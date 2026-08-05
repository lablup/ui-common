/**
 * Alert Circle Icon
 * Used for warnings and info alerts
 */

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}

export function AlertCircleIcon({ className, style, size }: IconProps) {
  const sizeValue = size ?? "1em";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={sizeValue}
      height={sizeValue}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
      />
    </svg>
  );
}
