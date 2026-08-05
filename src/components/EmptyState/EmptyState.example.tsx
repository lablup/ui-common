/**
 * EmptyState Component Examples
 *
 * Demonstrates usage of EmptyState component in different contexts.
 * Note: This file is for documentation/demonstration purposes only.
 */

import { EmptyState } from "./EmptyState";

// Example action handlers (no-op for demo purposes)
const handleNewChat = () => {
  // Implementation would go here
};
const handleBrowseModels = () => {
  // Implementation would go here
};
const handleOpenFolder = () => {
  // Implementation would go here
};
const handleCreate = () => {
  // Implementation would go here
};
const handleStartBenchmark = () => {
  // Implementation would go here
};
const handleViewHistory = () => {
  // Implementation would go here
};
const handleRetry = () => {
  // Implementation would go here
};
const handleReportIssue = () => {
  // Implementation would go here
};
const handleAddItem = () => {
  // Implementation would go here
};
const handleTakeAction = () => {
  // Implementation would go here
};

export function EmptyStateExamples() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Chat Empty State */}
      <div>
        <h2>Chat Empty State</h2>
        <EmptyState
          illustration="chat"
          title="No conversations yet"
          description="Start a new chat to begin interacting with your AI model"
          primaryAction={{
            label: "New Chat",
            onClick: handleNewChat,
          }}
          secondaryAction={{
            label: "Learn more",
            href: "#learn-more",
          }}
        />
      </div>

      {/* Models Empty State */}
      <div>
        <h2>Models Empty State</h2>
        <EmptyState
          illustration="models"
          title="No models installed"
          description="Download a model from Hugging Face to get started"
          primaryAction={{
            label: "Browse Models",
            onClick: handleBrowseModels,
          }}
          secondaryAction={{
            label: "Open Folder",
            onClick: handleOpenFolder,
          }}
        />
      </div>

      {/* Creations Empty State */}
      <div>
        <h2>Creations Empty State</h2>
        <EmptyState
          illustration="creations"
          title="No creations yet"
          description="Your generated images and content will appear here"
          primaryAction={{
            label: "Create Something",
            onClick: handleCreate,
          }}
        />
      </div>

      {/* Benchmark Empty State */}
      <div>
        <h2>Benchmark Empty State</h2>
        <EmptyState
          illustration="benchmark"
          title="No benchmarks run"
          description="Run a benchmark to compare model performance"
          primaryAction={{
            label: "Start Benchmark",
            onClick: handleStartBenchmark,
          }}
          secondaryAction={{
            label: "View History",
            onClick: handleViewHistory,
          }}
        />
      </div>

      {/* Logs Empty State */}
      <div>
        <h2>Logs Empty State</h2>
        <EmptyState
          illustration="logs"
          title="No logs available"
          description="Application logs will appear here when events occur"
        />
      </div>

      {/* Statistics Empty State */}
      <div>
        <h2>Statistics Empty State</h2>
        <EmptyState
          illustration="statistics"
          title="No statistics yet"
          description="Usage statistics will be displayed once you start using the application"
        />
      </div>

      {/* Error Empty State */}
      <div>
        <h2>Error Empty State</h2>
        <EmptyState
          illustration="error"
          title="Something went wrong"
          description="We encountered an error while loading your data"
          primaryAction={{
            label: "Retry",
            onClick: handleRetry,
          }}
          secondaryAction={{
            label: "Report Issue",
            onClick: handleReportIssue,
          }}
        />
      </div>

      {/* Generic Empty State */}
      <div>
        <h2>Generic Empty State</h2>
        <EmptyState
          illustration="generic"
          title="No items found"
          description="There are no items to display at this time"
          primaryAction={{
            label: "Add Item",
            onClick: handleAddItem,
          }}
        />
      </div>

      {/* Without Illustration */}
      <div>
        <h2>Without Illustration</h2>
        <EmptyState
          illustration="chat"
          title="Simple Empty State"
          description="This example doesn't show an illustration"
          showIllustration={false}
          primaryAction={{
            label: "Take Action",
            onClick: handleTakeAction,
          }}
        />
      </div>

      {/* Without Actions */}
      <div>
        <h2>Without Actions</h2>
        <EmptyState
          illustration="statistics"
          title="Informational Only"
          description="This empty state provides information without any actions"
        />
      </div>
    </div>
  );
}

export default EmptyStateExamples;
