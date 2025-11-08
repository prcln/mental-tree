import React, { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook for pagination logic with random position assignment
 * @param {Array} items - Array of items to paginate
 * @param {Array} positions - Array of position objects for item placement
 * @returns {Object} Pagination state and methods
 */
export const usePagination = (items, positions) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Fisher-Yates shuffle algorithm
  const shuffleArray = useCallback((array) => {
    if (!array || array.length === 0) return [];
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Initialize with shuffled positions
  const [shuffledPositions, setShuffledPositions] = useState(() => shuffleArray(positions));

  const itemsPerPage = positions.length || 1;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Shuffle positions when positions array changes
  useEffect(() => {
    setShuffledPositions(shuffleArray(positions));
  }, [positions, shuffleArray]);

  // Calculate current page data with randomized positions
  const paginationData = useMemo(() => {
    const startIdx = currentPage * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const currentItems = items.slice(startIdx, endIdx);
    
    // Only show items for which we have positions
    const visibleItems = currentItems.slice(0, shuffledPositions.length);
    const currentPositions = shuffledPositions.slice(0, visibleItems.length);

    return {
      visibleItems,
      currentPositions,
      startIdx,
      endIdx,
      totalItems: items.length
    };
  }, [items, shuffledPositions, currentPage, itemsPerPage]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((pageNumber) => {
    const validPage = Math.max(0, Math.min(pageNumber, totalPages - 1));
    setCurrentPage(validPage);
  }, [totalPages]);

  const resetPage = useCallback(() => {
    setCurrentPage(0);
  }, []);

  // Reshuffle positions manually
  const reshufflePositions = useCallback(() => {
    if (positions.length > 0) {
      setShuffledPositions(shuffleArray(positions));
    }
  }, [positions, shuffleArray]);

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    hasNextPage: currentPage < totalPages - 1,
    hasPrevPage: currentPage > 0,
    nextPage,
    prevPage,
    goToPage,
    resetPage,
    reshufflePositions, // New method to manually reshuffle
    ...paginationData
  };
};

/**
 * Predefined position sets for different contexts
 */
export const positionPresets = {
  // Dense garden layout - 24 positions
  gardenDense: [
    { x: 15, y: 30 }, { x: 25, y: 35 }, { x: 35, y: 28 }, { x: 45, y: 32 },
    { x: 55, y: 38 }, { x: 65, y: 30 }, { x: 75, y: 34 }, { x: 85, y: 28 },
    { x: 20, y: 50 }, { x: 30, y: 55 }, { x: 40, y: 48 }, { x: 50, y: 52 },
    { x: 60, y: 58 }, { x: 70, y: 50 }, { x: 80, y: 54 }, { x: 18, y: 70 },
    { x: 28, y: 75 }, { x: 38, y: 68 }, { x: 48, y: 72 }, { x: 58, y: 78 },
    { x: 68, y: 70 }, { x: 78, y: 74 }, { x: 22, y: 90 }, { x: 32, y: 95 }
  ],

  // Sparse garden layout - 12 positions
  gardenSparse: [
    { x: 20, y: 35 }, { x: 40, y: 30 }, { x: 60, y: 35 }, { x: 80, y: 30 },
    { x: 25, y: 55 }, { x: 45, y: 50 }, { x: 65, y: 55 }, { x: 85, y: 50 },
    { x: 30, y: 75 }, { x: 50, y: 70 }, { x: 70, y: 75 }, { x: 85, y: 70 }
  ],

  // Tree stages - matching your TreeVisualization
  treeSprout: [
    { x: 50, y: 40 },
    { x: 55, y: 35 }
  ],

  treeSapling: [
    { x: 45, y: 35 },
    { x: 55, y: 35 },
    { x: 50, y: 45 }
  ],

  treeYoung: [
    { x: 35, y: 30 },
    { x: 50, y: 25 },
    { x: 65, y: 30 },
    { x: 40, y: 45 },
    { x: 60, y: 45 }
  ],

  treeMature: [
    { x: 30, y: 25 },
    { x: 45, y: 20 },
    { x: 55, y: 20 },
    { x: 70, y: 25 },
    { x: 35, y: 40 },
    { x: 50, y: 35 },
    { x: 65, y: 40 },
    { x: 40, y: 55 },
    { x: 60, y: 55 }
  ],

  treeBlooming: [
    { x: 25, y: 25 },
    { x: 38, y: 20 },
    { x: 50, y: 18 },
    { x: 62, y: 20 },
    { x: 75, y: 25 },
    { x: 30, y: 35 },
    { x: 45, y: 32 },
    { x: 55, y: 32 },
    { x: 70, y: 35 },
    { x: 35, y: 48 },
    { x: 50, y: 45 },
    { x: 65, y: 48 },
    { x: 40, y: 60 },
    { x: 55, y: 62 },
    { x: 70, y: 60 }
  ]
};


/**
 * Get positions for a specific tree stage
 */
export const getTreeStagePositions = (stage) => {
  const stageMap = {
    seed: [],
    sprout: positionPresets.treeSprout,
    sapling: positionPresets.treeSapling,
    young: positionPresets.treeYoung,
    mature: positionPresets.treeMature,
    blooming: positionPresets.treeBlooming
  };
  
  return stageMap[stage] || [];
};