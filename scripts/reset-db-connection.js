const { PrismaClient } = require('@prisma/client');

async function resetDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Clearing database connection pools...');
    
    // Disconnect all existing connections
    await prisma.$disconnect();
    
    console.log('Connection pools cleared successfully!');
    console.log('You can now restart your development server.');
    
  } catch (error) {
    console.error('Error clearing connection pools:', error);
  } finally {
    process.exit(0);
  }
}

resetDatabaseConnection();
