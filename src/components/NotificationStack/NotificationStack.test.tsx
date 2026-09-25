import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { NotificationStack, type NotificationStackItem } from "./NotificationStack";

const items = (count: number): Array<NotificationStackItem> =>
  Array.from({ length: count }, (_, i) => ({ key: `n${i}`, title: `Notice ${i}` }));

const renderedKeys = () =>
  Array.from(
    screen.getByTestId("stack").querySelectorAll("[data-notification-key]"),
  ).map((el) => el.getAttribute("data-notification-key"));

describe("NotificationStack", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<NotificationStack notifications={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders every notice, oldest first, when maxVisible is unset", () => {
    render(<NotificationStack data-testid="stack" notifications={items(5)} />);
    expect(renderedKeys()).toEqual(["n0", "n1", "n2", "n3", "n4"]);
  });

  it("keeps only the newest notices when maxVisible is set", () => {
    render(
      <NotificationStack data-testid="stack" notifications={items(5)} maxVisible={3} />,
    );
    expect(renderedKeys()).toEqual(["n2", "n3", "n4"]);
  });

  it("puts className on the stack and hooks on each notice", () => {
    render(
      <NotificationStack
        data-testid="stack"
        className="host-hook"
        notifications={[{ key: "a", title: "Saved", status: "success" }]}
      />,
    );
    const stack = screen.getByTestId("stack");
    expect(stack).toHaveClass("uic-notification-stack", "host-hook");
    const notice = stack.querySelector("[data-notification-key='a']");
    expect(notice).toHaveAttribute("data-status", "success");
    expect(notice).toHaveAttribute("data-paused", "false");
    expect(screen.getByTestId("notification-title")).toHaveTextContent("Saved");
  });

  it("wraps a description in the scrollable body, never the notice itself", () => {
    render(
      <NotificationStack
        notifications={[{ key: "e", title: "Failed", description: "x".repeat(5000) }]}
      />,
    );
    const description = screen.getByTestId("notification-description");
    expect(description.closest(".uic-notification-stack__body")).not.toBeNull();
    expect(document.querySelector(".uic-notification-stack__item")).not.toHaveClass(
      "uic-notification-stack__body",
    );
  });

  it("renders no scrollable body when there is nothing to scroll", () => {
    render(<NotificationStack notifications={[{ key: "a", title: "A" }]} />);
    expect(document.querySelector(".uic-notification-stack__body")).toBeNull();
  });

  it("does not surface a hidden notice that is closed", () => {
    const five = items(5);
    const { rerender } = render(
      <NotificationStack data-testid="stack" notifications={five} maxVisible={3} />,
    );
    rerender(
      <NotificationStack
        data-testid="stack"
        notifications={five.filter((n) => n.key !== "n0")}
        maxVisible={3}
      />,
    );
    expect(renderedKeys()).toEqual(["n2", "n3", "n4"]);
  });

  it("keeps a removed notice mounted while it slides out", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <NotificationStack data-testid="stack" notifications={items(2)} />,
    );
    rerender(<NotificationStack data-testid="stack" notifications={items(1)} />);
    const leaving = document.querySelector("[data-notification-key='n1']");
    expect(leaving).toHaveAttribute("data-exiting", "true");
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(renderedKeys()).toEqual(["n0"]);
  });

  it("closes through the dismiss button", async () => {
    const onClose = vi.fn();
    render(
      <NotificationStack
        notifications={[{ key: "e", title: "Failed", description: "x".repeat(5000) }]}
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onClose).toHaveBeenCalledWith("e");
  });

  it("closes itself after its duration, pausing while hovered", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <NotificationStack
        notifications={[{ key: "t", title: "Done", duration: 2 }]}
        onClose={onClose}
      />,
    );
    const notice = document.querySelector("[data-notification-key='t']") as HTMLElement;
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.mouseEnter(notice);
    expect(notice).toHaveAttribute("data-paused", "true");
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseLeave(notice);
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(onClose).toHaveBeenCalledWith("t");
  });

  it("keeps a notice with duration 0 open", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <NotificationStack
        notifications={[{ key: "p", title: "Pending", duration: 0 }]}
        onClose={onClose}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders task progress and the task actions", async () => {
    const onCancel = vi.fn();
    const onRetry = vi.fn();
    const onAction = vi.fn();
    render(
      <NotificationStack
        notifications={[
          {
            key: "u",
            title: "Uploading",
            percent: 40,
            onCancel,
            onRetry,
            actionText: "Open folder",
            onAction,
          },
        ]}
      />,
    );
    expect(screen.getByRole("progressbar", { name: "Uploading" })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    await userEvent.click(screen.getByRole("button", { name: "Open folder" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("replaces the header with its own content", () => {
    render(
      <NotificationStack
        notifications={[
          { key: "c", title: "Ignored", content: <strong>Custom body</strong> },
        ]}
      />,
    );
    expect(screen.getByText("Custom body")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-title")).not.toBeInTheDocument();
  });

  it("takes its default labels from the shipped translations", () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <NotificationStack
          notifications={[
            {
              key: "k",
              title: <em>Upload</em>,
              percent: 10,
              onCancel: () => undefined,
              onRetry: () => undefined,
            },
          ]}
        />
      </InternationalizationProvider>,
    );
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "작업 진행률" }),
    ).toBeInTheDocument();
  });
});
