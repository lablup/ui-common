/**
 * ErrorState Component Examples
 *
 * Demonstrates all error type variants and usage patterns.
 * This file is for documentation purposes and shows how to use the component.
 */

import { ErrorState } from "./ErrorState";

/**
 * Example: Network Error
 * Used when connection to server fails
 */
export function NetworkErrorExample() {
  return (
    <ErrorState
      tone="warning"
      title="Connection Error"
      message="Could not connect to the inference server. Please check if the model is loaded and the server is running."
      primaryAction={{
        label: "Retry Connection",
        onClick: () => {
          // Retry connection logic
          console.log("Retrying connection...");
        },
      }}
      secondaryAction={{
        label: "View Logs",
        onClick: () => {
          // Navigate to logs page
          console.log("Opening logs...");
        },
      }}
    />
  );
}

/**
 * Example: Configuration Error
 * Used when there are configuration/settings issues
 */
export function ConfigurationErrorExample() {
  return (
    <ErrorState
      tone="accent"
      title="Configuration Error"
      message="Invalid settings detected. Please check your configuration and try again."
      primaryAction={{
        label: "Go to Settings",
        onClick: () => {
          // Navigate to settings
          console.log("Opening settings...");
        },
      }}
    />
  );
}

/**
 * Example: Model Error
 * Used when model loading or access fails
 */
export function ModelErrorExample() {
  return (
    <ErrorState
      tone="danger"
      title="Model Error"
      message="Failed to load the selected model. The model file may be corrupted or incompatible."
      primaryAction={{
        label: "Manage Models",
        onClick: () => {
          // Navigate to models page
          console.log("Opening models page...");
        },
      }}
      secondaryAction={{
        label: "Report Issue",
        onClick: () => {
          // Open issue reporting
          console.log("Opening issue reporter...");
        },
      }}
    />
  );
}

/**
 * Example: Permission Error
 * Used when access is denied
 */
export function PermissionErrorExample() {
  return (
    <ErrorState
      tone="warning"
      title="Permission Denied"
      message="You don't have the necessary permissions to access this resource."
      primaryAction={{
        label: "Get Help",
        onClick: () => {
          // Open help documentation
          console.log("Opening help...");
        },
      }}
    />
  );
}

/**
 * Example: Generic Error
 * Used as fallback for unknown errors
 */
export function GenericErrorExample() {
  return (
    <ErrorState
      tone="danger"
      title="An Error Occurred"
      message="Something unexpected happened. Please try again later."
      primaryAction={{
        label: "Try Again",
        onClick: () => {
          // Retry the operation
          console.log("Retrying...");
        },
      }}
    />
  );
}

/**
 * Example: Minimal Error (no actions)
 * Used when no user actions are available
 */
export function MinimalErrorExample() {
  return (
    <ErrorState
      tone="danger"
      title="Unable to Load Content"
      message="This content is currently unavailable."
    />
  );
}

/**
 * Example: Error without icon
 * Used in compact layouts where space is limited
 */
export function CompactErrorExample() {
  return (
    <ErrorState
      tone="warning"
      title="Connection Failed"
      message="Unable to reach the server."
      showIcon={false}
      primaryAction={{
        label: "Retry",
        onClick: () => {
          console.log("Retry");
        },
      }}
    />
  );
}

/**
 * Example: Custom styled error
 * Shows how to add custom styling
 */
export function CustomStyledErrorExample() {
  return (
    <ErrorState
      tone="danger"
      title="Model Incompatible"
      message="This model requires a newer version of the inference engine."
      className="custom-error-style"
      primaryAction={{
        label: "Check for Updates",
        onClick: () => {
          console.log("Checking updates");
        },
      }}
    />
  );
}
