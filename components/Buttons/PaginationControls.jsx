import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './PaginationControls.css';

/**
 * Reusable pagination controls component
 * @param {Object} props
 * @param {number} props.currentPage - Current page index (0-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.startIdx - Start index of current items
 * @param {number} props.endIdx - End index of current items
 * @param {number} props.totalItems - Total number of items
 * @param {Function} props.onNextPage - Handler for next page
 * @param {Function} props.onPrevPage - Handler for previous page
 * @param {boolean} props.hasNextPage - Whether there is a next page
 * @param {boolean} props.hasPrevPage - Whether there is a previous page
 * @param {string} props.variant - Style variant ('floating' | 'inline' | 'minimal')
 * @param {string} props.className - Additional CSS classes
 */
const PaginationControls = ({
  currentPage,
  totalPages,
  startIdx,
  endIdx,
  totalItems,
  onNextPage,
  onPrevPage,
  hasNextPage,
  hasPrevPage,
  variant = 'floating',
  className = ''
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`pagination-controls pagination-${variant} ${className}`}>
      <button
        onClick={onPrevPage}
        disabled={!hasPrevPage}
        className={`pagination-btn ${!hasPrevPage ? 'disabled' : ''}`}
        aria-label="Previous page"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div className="pagination-info">
        <span className="page-number">
          Page {currentPage + 1} of {totalPages}
        </span>
        <span className="message-range">
          ({startIdx + 1}-{Math.min(endIdx, totalItems)} of {totalItems})
        </span>
      </div>
      
      <button
        onClick={onNextPage}
        disabled={!hasNextPage}
        className={`pagination-btn ${!hasNextPage ? 'disabled' : ''}`}
        aria-label="Next page"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default PaginationControls;