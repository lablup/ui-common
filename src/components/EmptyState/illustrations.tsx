/**
 * EmptyState Illustrations
 *
 * SVG illustration components for different empty state contexts.
 * All illustrations are inline React components for optimal performance.
 * Each component is memoized to prevent unnecessary re-renders.
 */

import { memo } from "react";

interface IllustrationProps {
  className?: string;
}

/**
 * Chat illustration - Speech bubbles with sparkles
 */
export const ChatIllustration = memo(function ChatIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Chat bubble */}
      <g className="illustration-bubble">
        <rect
          x="20"
          y="30"
          width="70"
          height="50"
          rx="12"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M40 80 L50 70 L90 70"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Message lines */}
        <line
          x1="35"
          y1="45"
          x2="75"
          y2="45"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="35"
          y1="55"
          x2="65"
          y2="55"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      {/* Sparkles */}
      <g className="illustration-sparkle">
        <path
          d="M95 25 L97 32 L104 34 L97 36 L95 43 L93 36 L86 34 L93 32 Z"
          fill="currentColor"
        />
        <path
          d="M25 15 L26 19 L30 20 L26 21 L25 25 L24 21 L20 20 L24 19 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
});

/**
 * Models illustration - Package/download box
 */
export const ModelsIllustration = memo(function ModelsIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 3D box representing model package */}
      <g className="illustration-box">
        <path
          d="M60 20 L95 40 L95 80 L60 100 L25 80 L25 40 Z"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M60 20 L60 100"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M25 40 L60 60 L95 40"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {/* Download arrow */}
      <g className="illustration-arrow">
        <path
          d="M60 45 L60 75"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M52 67 L60 75 L68 67"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
});

/**
 * Creations illustration - Gallery frame
 */
export const CreationsIllustration = memo(function CreationsIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Gallery frame */}
      <rect
        x="20"
        y="25"
        width="80"
        height="70"
        rx="8"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      {/* Image placeholder with mountain and sun */}
      <g className="illustration-image">
        <circle cx="45" cy="45" r="8" stroke="currentColor" strokeWidth="2" />
        <path
          d="M20 80 L40 60 L60 75 L85 50 L100 65 L100 95 L20 95 Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
});

/**
 * Benchmark illustration - Speedometer
 */
export const BenchmarkIllustration = memo(function BenchmarkIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 512 512"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Speedometer body */}
      <path d="M92.231,401.523l-24.69,12.044C49.475,381.325,40,345.338,40,308.499c0-26.991,4.977-52.842,14.06-76.683l28.291,13.57c2.79,1.338,5.735,1.972,8.636,1.972c7.453,0,14.608-4.185,18.047-11.355c4.776-9.959,0.576-21.906-9.384-26.683l-27.932-13.398c34.717-56.62,94.784-96.095,164.283-102.505v30.081c0,11.046,8.954,20,20,20c11.046,0,20-8.954,20-20V93.402c23.828,2.169,46.884,8.237,68.771,18.117c10.065,4.545,21.912,0.066,26.457-9.999c4.545-10.068,0.068-21.913-10-26.458C328.063,60.091,292.659,52.499,256,52.499c-68.38,0-132.667,26.628-181.02,74.98C26.629,175.832,0,240.119,0,308.499c0,50.53,14.998,99.674,43.373,142.115c3.822,5.715,10.141,8.886,16.639,8.886c2.954,0,5.946-0.655,8.757-2.026l41-20c9.928-4.843,14.05-16.816,9.207-26.744C114.133,400.803,102.159,396.682,92.231,401.523z" />
      <path d="M489.436,203.271c-4.544-10.067-16.387-14.547-26.458-10c-10.067,4.545-14.544,16.39-9.999,26.457C465.601,247.686,472,277.553,472,308.499c0,36.894-9.506,72.939-27.625,105.218l-25.777-12.275c-9.971-4.748-21.906-0.515-26.656,9.459c-4.749,9.972-0.514,21.907,9.459,26.656l42,20c2.763,1.315,5.692,1.944,8.588,1.944c6.5,0,12.82-3.175,16.637-8.886C497.002,408.173,512,359.029,512,308.499C512,271.84,504.408,236.436,489.436,203.271z" />
      {/* Speedometer needle - animated */}
      <g className="illustration-needle">
        <path d="M435.143,129.356c-6.796-6.795-17.463-7.797-25.407-2.384c-29.926,20.398-180.03,122.969-196.162,139.1c-23.394,23.395-23.394,61.459,0,84.854c11.697,11.696,27.063,17.545,42.427,17.545c15.364,0,30.729-5.849,42.427-17.545c16.131-16.132,118.701-166.236,139.1-196.162C442.939,146.821,441.938,136.153,435.143,129.356z M270.142,322.641c-7.797,7.799-20.486,7.799-28.283,0c-7.798-7.797-7.799-20.482-0.004-28.28c6.268-6.194,48.885-36.588,101.319-73.035C306.728,273.76,276.334,316.375,270.142,322.641z" />
      </g>
    </svg>
  );
});

/**
 * Logs illustration - Document stack
 */
export const LogsIllustration = memo(function LogsIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Stacked documents */}
      <g className="illustration-docs">
        {/* Back document */}
        <rect
          x="35"
          y="20"
          width="60"
          height="75"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.4"
        />
        {/* Middle document */}
        <rect
          x="30"
          y="25"
          width="60"
          height="75"
          rx="4"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          opacity="0.6"
        />
        {/* Front document */}
        <rect
          x="25"
          y="30"
          width="60"
          height="75"
          rx="4"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        {/* Text lines */}
        <line
          x1="35"
          y1="45"
          x2="70"
          y2="45"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="35"
          y1="55"
          x2="75"
          y2="55"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="35"
          y1="65"
          x2="65"
          y2="65"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="35"
          y1="75"
          x2="70"
          y2="75"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
});

/**
 * Statistics illustration - Chart placeholder
 */
export const StatisticsIllustration = memo(function StatisticsIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Chart axes */}
      <g className="illustration-axes">
        <line
          x1="25"
          y1="20"
          x2="25"
          y2="90"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="25"
          y1="90"
          x2="95"
          y2="90"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      {/* Bar chart */}
      <g className="illustration-bars">
        <rect
          x="35"
          y="60"
          width="10"
          height="25"
          rx="2"
          fill="currentColor"
          opacity="0.6"
        />
        <rect
          x="50"
          y="45"
          width="10"
          height="40"
          rx="2"
          fill="currentColor"
          opacity="0.8"
        />
        <rect
          x="65"
          y="55"
          width="10"
          height="30"
          rx="2"
          fill="currentColor"
          opacity="0.7"
        />
        <rect x="80" y="35" width="10" height="50" rx="2" fill="currentColor" />
      </g>
    </svg>
  );
});

/**
 * Error illustration - Warning/error state
 */
export const ErrorIllustration = memo(function ErrorIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Triangle warning */}
      <g className="illustration-warning">
        <path
          d="M60 25 L100 95 L20 95 Z"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Exclamation mark */}
        <line
          x1="60"
          y1="50"
          x2="60"
          y2="70"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="60" cy="80" r="2.5" fill="currentColor" />
      </g>
    </svg>
  );
});

/**
 * Text illustration - Document with bookmark
 */
export const TextIllustration = memo(function TextIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Document */}
      <g className="illustration-docs">
        <rect
          x="25"
          y="15"
          width="60"
          height="80"
          rx="6"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        {/* Text lines */}
        <line
          x1="37"
          y1="35"
          x2="73"
          y2="35"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="37"
          y1="47"
          x2="68"
          y2="47"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="37"
          y1="59"
          x2="73"
          y2="59"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="37"
          y1="71"
          x2="58"
          y2="71"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      {/* Bookmark */}
      <g className="illustration-sparkle">
        <path
          d="M78 10 L78 38 L90 30 L102 38 L102 10 Z"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
});

/**
 * Schedule illustration - Calendar with clock
 */
export const ScheduleIllustration = memo(function ScheduleIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Calendar body */}
      <g className="illustration-docs">
        <rect
          x="20"
          y="30"
          width="65"
          height="65"
          rx="8"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        {/* Calendar header bar */}
        <line x1="20" y1="48" x2="85" y2="48" stroke="currentColor" strokeWidth="2.5" />
        {/* Calendar pins */}
        <line
          x1="38"
          y1="25"
          x2="38"
          y2="35"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="67"
          y1="25"
          x2="67"
          y2="35"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Calendar grid dots */}
        <circle cx="35" cy="58" r="2.5" fill="currentColor" opacity="0.5" />
        <circle cx="52" cy="58" r="2.5" fill="currentColor" opacity="0.5" />
        <circle cx="35" cy="72" r="2.5" fill="currentColor" opacity="0.5" />
        <circle cx="52" cy="72" r="2.5" fill="currentColor" opacity="0.5" />
        <circle cx="35" cy="86" r="2.5" fill="currentColor" opacity="0.5" />
      </g>
      {/* Clock overlay */}
      <g className="illustration-sparkle">
        <circle
          cx="82"
          cy="80"
          r="20"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="var(--token-colorBgContainer, #fff)"
        />
        <line
          x1="82"
          y1="80"
          x2="82"
          y2="70"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="82"
          y1="80"
          x2="92"
          y2="80"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="82" cy="80" r="2" fill="currentColor" />
      </g>
    </svg>
  );
});

/**
 * Generic illustration - Placeholder icon
 */
export const GenericIllustration = memo(function GenericIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Simple folder/file icon */}
      <g className="illustration-folder">
        <path
          d="M25 35 L25 85 C25 90 28 92 33 92 L87 92 C92 92 95 90 95 85 L95 45 C95 40 92 38 87 38 L60 38 L52 28 L33 28 C28 28 25 30 25 35 Z"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
});
