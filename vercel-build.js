const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log("=== Vercel Build Step 1: Frontend ===");
    execSync('npm install', { cwd: './frontend', stdio: 'inherit' });
    execSync('npm run build', { cwd: './frontend', stdio: 'inherit' });

    console.log("=== Vercel Build Step 2: Backend ===");
    execSync('npm install', { cwd: './backend', stdio: 'inherit' });

    console.log("=== Vercel Build Step 3: Routing Output ===");
    if (fs.existsSync('./public')) {
        fs.rmSync('./public', { recursive: true, force: true });
    }
    // Vercel looks for a 'public' directory by default when Framework is 'Other'
    fs.cpSync('./frontend/dist', './public', { recursive: true });
    console.log("✅ Build complete. Artifacts successfully routed to /public");
} catch (error) {
    console.error("❌ Build failed!", error);
    process.exit(1);
}
