#!/bin/bash
# Run this from inside /Users/andresimach/Documents/Web/Tobias-distribuciones/
set -e

echo "Setting up Tobias Distribuciones..."

# Init Next.js (will warn about existing dir, that's fine)
npx create-next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-turbopack --yes \
  --name tobias-distribuciones 2>/dev/null || true

# Install extra deps
npm install @libsql/client @prisma/adapter-libsql @prisma/client prisma zustand lucide-react
npm install -D @types/bcryptjs tsx

# Create .env
cat > .env << 'EOF'
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="tobias-distribuciones-secret-2026"
NEXTAUTH_URL="http://localhost:3000"
WHATSAPP_NUMBER="5491100000000"
EOF

echo ""
echo "✓ Base project created. Now copy the src/ and prisma/ files from the instructions."
echo "Then run: npx prisma migrate dev --name init && npm run db:seed && npm run dev"
