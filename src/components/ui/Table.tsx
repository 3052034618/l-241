import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils.js';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);

Table.displayName = 'Table';

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props}>
      {children}
    </thead>
  )
);

TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  )
);

TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b border-secondary-100 transition-colors hover:bg-secondary-50', className)}
      {...props}
    >
      {children}
    </tr>
  )
);

TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-secondary-600 bg-secondary-50',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
);

TableHead.displayName = 'TableHead';

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  colSpan?: number;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-4 align-middle text-secondary-700', className)}
      {...props}
    >
      {children}
    </td>
  )
);

TableCell.displayName = 'TableCell';

export default Table;
