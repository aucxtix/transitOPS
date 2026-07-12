import React from 'react';

export const SkeletonRow = ({ cols = 5 }) => {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-foreground/10 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );
};
