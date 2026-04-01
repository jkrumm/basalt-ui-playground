import type { IndicatorRow } from "../routes/table.tsx";
import { Intent, ProgressBar, Tag } from "@blueprintjs/core";
import { Cell, Column, Table2 } from "@blueprintjs/table";

function intentOf(v: number | null): Intent {
  if (v === null) return Intent.NONE;
  if (v < 0.33) return Intent.SUCCESS;
  if (v < 0.66) return Intent.WARNING;
  return Intent.DANGER;
}

export function BlueprintTableSection({ data }: { data: IndicatorRow[] }) {
  const nameRenderer = (rowIndex: number) => (
    <Cell>
      <strong>{data[rowIndex]?.name}</strong>
    </Cell>
  );

  const descRenderer = (rowIndex: number) => (
    <Cell style={{ fontSize: 12, color: "#8f99a8" }}>{data[rowIndex]?.desc}</Cell>
  );

  const valueRenderer = (rowIndex: number) => {
    const v = data[rowIndex]?.value ?? null;
    return (
      <Cell>
        <Tag minimal intent={intentOf(v)}>
          {v !== null ? `${(v * 100).toFixed(1)}%` : "—"}
        </Tag>
      </Cell>
    );
  };

  const zoneRenderer = (rowIndex: number) => (
    <Cell style={{ fontSize: 13 }}>{data[rowIndex]?.zone}</Cell>
  );

  const scoreRenderer = (rowIndex: number) => {
    const v = data[rowIndex]?.value ?? null;
    return (
      <Cell>
        <ProgressBar
          value={v ?? 0}
          intent={intentOf(v)}
          animate={false}
          stripes={false}
          style={{ marginTop: 6 }}
        />
      </Cell>
    );
  };

  return (
    <Table2
      numRows={data.length}
      columnWidths={[160, 280, 80, 150, 150]}
      rowHeights={data.map(() => 36)}
      enableColumnResizing
      enableRowResizing={false}
      enableMultipleSelection={false}
    >
      <Column name="Indicator" cellRenderer={nameRenderer} />
      <Column name="Description" cellRenderer={descRenderer} />
      <Column name="Value" cellRenderer={valueRenderer} />
      <Column name="Zone" cellRenderer={zoneRenderer} />
      <Column name="Score" cellRenderer={scoreRenderer} />
    </Table2>
  );
}
