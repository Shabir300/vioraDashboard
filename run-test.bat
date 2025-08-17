@echo off
echo 🔧 Setting up Pipeline Test Environment...

echo.
echo 📦 Installing dependencies...
call npm install

echo.
echo 🗄️ Generating Prisma client...
call npx prisma generate

echo.
echo 📊 Running database seed...
call npx prisma db seed

echo.
echo 🏗️ Building application...
call npm run build

echo.
echo 🚀 Application built successfully!
echo.
echo To test the pipeline system:
echo   1. Start the development server: npm run dev
echo   2. Open http://localhost:3000 in your browser
echo   3. Navigate to /pipeline-tab to create pipelines
echo   4. Navigate to /pipeline to view and manage pipelines
echo.
echo For API testing, run: node test-pipeline.js
echo.
pause
