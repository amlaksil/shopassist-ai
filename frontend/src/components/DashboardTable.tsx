import type { ReactNode } from 'react';

export interface DashboardTableColumn<Row> {
  key: string;
  header: string;
  className?: string;
  render: (row: Row) => ReactNode;
}

interface DashboardTableProps<Row extends { id: string }> {
  title: string;
  description: string;
  rows: Row[];
  columns: DashboardTableColumn<Row>[];
  emptyMessage: string;
  summaryLabel?: string;
}

export function DashboardTable<Row extends { id: string }>({
  title,
  description,
  rows,
  columns,
  emptyMessage,
  summaryLabel
}: DashboardTableProps<Row>) {
  return (
    <section className="workspace-card workspace-card--table">
      <header className="workspace-card__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {summaryLabel ? <span className="workspace-card__meta">{summaryLabel}</span> : null}
      </header>

      <div className="table-shell">
        <table aria-label={title}>
          <caption className="sr-only">{description}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={column.className}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key} className={column.className}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="table-empty">
                    <strong>No records to show</strong>
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
