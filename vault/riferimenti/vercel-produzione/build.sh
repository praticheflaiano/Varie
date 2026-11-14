set -e
REF=refs/heads/nuova-grafica-info
rm -rf src public
mkdir src
curl -fsSL https://codeload.github.com/praticheflaiano/Varie/tar.gz/$REF -o src.tgz
tar xzf src.tgz -C src --strip-components=1
cd src/sito
node -v
npm ci --no-audit --no-fund
npm run build
cd ../..
cp -r src/sito/dist public
rm -f public/vercel.json
ls public | head -60
