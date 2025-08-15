@echo off
echo 🔧 Installing dependencies...
call npm install

echo 🗄️  Generating Prisma client...
call npx prisma generate

echo 🏗️  Building Next.js application...
call npm run build

echo ✅ Build completed successfully!
pause
