import prisma from './prisma';

/**
 * Clears database cached query plans by disconnecting and reconnecting
 * This helps resolve PostgreSQL "cached plan must not change result type" errors
 */
export async function clearCachedPlans(): Promise<void> {
  try {
    console.log('Clearing database cached plans...');
    await prisma.$disconnect();
    
    // Brief delay to allow connection cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Force a new connection by making a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('Database cached plans cleared successfully');
  } catch (error) {
    console.error('Failed to clear cached plans:', error);
    // Don't throw - this is a recovery operation
  }
}

/**
 * Executes a query with automatic retry if cached plan errors occur
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // Check if this is a cached plan error
      const isCachedPlanError = 
        error?.code === 'P2010' || 
        error?.message?.includes('cached plan') ||
        error?.message?.includes('result type');
      
      if (isCachedPlanError && attempt < maxRetries) {
        console.log(`Cached plan error on attempt ${attempt}, clearing plans and retrying...`);
        await clearCachedPlans();
        continue;
      }
      
      // If it's not a cached plan error, or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError;
}
