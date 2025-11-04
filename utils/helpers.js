// Generic error handler for queries
export const handleQueryError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  throw new Error(`${context}: ${error.message}`);
};

// Safe single row fetch (returns first row or throws meaningful error)
export const fetchSingleRow = async (query, context) => {
  const { data, error } = await query;
  
  if (error) handleQueryError(error, context);
  if (!data || data.length === 0) throw new Error(`${context}: No data found`);
  
  return data[0];
};