/**
 * Dashboard: a Board of panels the user can move and resize.
 *
 * Each panel's `title` is a BoardItemTitle (title, help tooltip, refresh)
 * and its `description` the content, here a few Statistics; the Board draws
 * and pads both. Keep the layout the Board reports in `onItemsChange` (user
 * settings or local storage) so it survives a reload.
 *
 * Presentation only: replace the panels' content with the app's own.
 */
import { useState, type ReactNode } from "react";
import {
  Board,
  BoardItemTitle,
  HStack,
  IconButton,
  PageHeader,
  PageLayout,
  Statistic,
  VStack,
  type BoardItem,
} from "@lablup/ui-common";
import { RotateCw } from "lucide-react";

interface PanelSpec {
  id: string;
  title: string;
  tooltip?: string;
  content: ReactNode;
  columnSpan?: number;
  rowSpan?: number;
}

function panel({
  id,
  title,
  tooltip,
  content,
  columnSpan = 2,
  rowSpan = 2,
}: PanelSpec): BoardItem<null> {
  return {
    id,
    columnSpan,
    rowSpan,
    title: (
      <BoardItemTitle
        title={title}
        tooltip={tooltip}
        endContent={
          <IconButton
            label={`Refresh ${title}`}
            icon={<RotateCw />}
            variant="ghost"
            size="sm"
            onClick={() => {
              // Refetch this panel's data.
            }}
          />
        }
      />
    ),
    description: content,
    data: null,
  };
}

const INITIAL_ITEMS: ReadonlyArray<BoardItem<null>> = [
  panel({
    id: "sessions",
    title: "Sessions",
    tooltip: "Sessions in the current project.",
    content: (
      <HStack gap={6}>
        <Statistic label="Running" value={12} />
        <Statistic label="Pending" value={3} />
      </HStack>
    ),
  }),
  panel({
    id: "usage",
    title: "Resource usage",
    content: (
      <VStack gap={2}>
        <Statistic
          label="CPU"
          value={24}
          total={64}
          unit="cores"
          progressMode="visible"
        />
        <Statistic
          label="Memory"
          value={96}
          total={256}
          unit="GiB"
          progressMode="visible"
        />
      </VStack>
    ),
  }),
];

export default function DashboardBoard() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  return (
    <PageLayout variant="wide">
      <VStack gap={4}>
        <PageHeader title="Dashboard" />
        <Board
          items={items}
          isMovable
          isResizable
          variant="bordered"
          onItemsChange={({ items: next }) => setItems(next)}
        />
      </VStack>
    </PageLayout>
  );
}
