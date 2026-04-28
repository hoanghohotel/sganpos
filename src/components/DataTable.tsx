import React from 'react';
import { cn } from '../lib/utils';

/* Table Wrapper */
interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className }) => (
  <div className={cn('overflow-x-auto rounded-lg border border-slate-200', className)}>
    <table className="w-full text-sm">{children}</table>
  </div>
);

/* Table Head */
interface TableHeadProps {
  children: React.ReactNode;
}

export const TableHead: React.FC<TableHeadProps> = ({ children }) => (
  <thead className="bg-slate-50 border-b border-slate-200">
    {children}
  </thead>
);

/* Table Body */
interface TableBodyProps {
  children: React.ReactNode;
}

export const TableBody: React.FC<TableBodyProps> = ({ children }) => (
  <tbody className="divide-y divide-slate-200">{children}</tbody>
);

/* Table Row */
interface TableRowProps {
  children: React.ReactNode;
  isHeader?: boolean;
  isHoverable?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({ children, isHeader = false, isHoverable = true }) => (
  <tr className={cn('bg-white', isHoverable && 'hover:bg-slate-50 transition-colors')}>
    {children}
  </tr>
);

/* Table Header Cell */
interface TableCellProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const TableHeaderCell: React.FC<TableCellProps> = ({ children, align = 'left', className }) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <th className={cn('px-6 py-3 font-semibold text-slate-700 uppercase text-xs tracking-wide', alignClasses[align], className)}>
      {children}
    </th>
  );
};

/* Table Data Cell */
interface TableDataProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const TableData: React.FC<TableDataProps> = ({ children, align = 'left', className }) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <td className={cn('px-6 py-4 text-slate-900 font-medium', alignClasses[align], className)}>
      {children}
    </td>
  );
};

/* Empty State */
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export const TableEmptyState: React.FC<EmptyStateProps> = ({ title, description, icon }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="mb-4 text-slate-300">{icon}</div>}
    <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
    {description && <p className="text-slate-500 text-sm">{description}</p>}
  </div>
);

/* Pagination */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center justify-between gap-4 p-4 border-t border-slate-200 bg-slate-50">
    <span className="text-sm text-slate-600">
      Trang {currentPage} của {totalPages}
    </span>
    <div className="flex gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Trước
      </button>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Tiếp
      </button>
    </div>
  </div>
);
