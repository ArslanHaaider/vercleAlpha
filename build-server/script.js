const { exec } = require("child_process");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require('mime-types');
const path = require("path");
const fs = require('fs');

const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
});
const PROJECT_ID = process.env.PROJECT_ID;
const GIT_REPO = process.env.GIT_REPOSITORY_URL;

async function runCommand(command, cwd) {
    return new Promise((resolve, reject) => {
        console.log(`Executing command: ${command} in directory: ${cwd}`);
        
        const process = exec(command, { cwd });

        let stdoutData = '';
        let stderrData = '';

        process.stdout.on('data', (data) => {
            stdoutData += data;
            console.log(`stdout: ${data.toString()}`);
        });

        process.stderr.on('data', (data) => {
            stderrData += data;
            console.error(`stderr: ${data.toString()}`);
        });

        process.on('close', (code) => {
            console.log(`Process exited with code ${code}`);
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}\nstdout: ${stdoutData}\nstderr: ${stderrData}`));
            }
        });

        process.on('error', (error) => {
            console.error('Process error:', error);
            reject(error);
        });
    });
}

async function initializeDirectory() {
    const outDirPath = path.join(__dirname, 'output');
    console.log("Initializing directory structure...");
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outDirPath)) {
        console.log("Creating output directory:", outDirPath);
        fs.mkdirSync(outDirPath, { recursive: true });
    }

    // Clone the repository
    if (!GIT_REPO) {
        throw new Error("GIT_REPOSITORY_URL environment variable is not set");
    }

    console.log("Cloning repository...");
    await runCommand(`git clone ${GIT_REPO} .`, outDirPath);
    
    return outDirPath;
}

async function buildAndUpload() {
    try {
        // Initialize directory and clone repository
        const outDirPath = await initializeDirectory();
        console.log("Current directory:", __dirname);
        console.log("Output directory path:", outDirPath);
        
        // List contents of output directory
        console.log("Contents of output directory:", fs.readdirSync(outDirPath));

        const distFolderPath = path.join(outDirPath, 'dist');

        try {
            console.log("Running npm install...");
            await runCommand('npm install', outDirPath);

            console.log("Running npm run build...");
            await runCommand('npm run build', outDirPath);

            if (!fs.existsSync(distFolderPath)) {
                console.error("Dist folder not found after build at:", distFolderPath);
                console.log("Contents of output directory after build:", fs.readdirSync(outDirPath));
                throw new Error("Build failed: dist folder not created");
            }

            console.log("Build completed successfully.");
            console.log("Contents of dist folder:", fs.readdirSync(distFolderPath));

            const distFolderContents = fs.readdirSync(distFolderPath, { withFileTypes: true });

            for (const file of distFolderContents) {
                const filePath = path.join(distFolderPath, file.name);
                console.log("Uploading:", filePath);

                const command = new PutObjectCommand({
                    Bucket: 'vercel-alpha',
                    Key: `__outputs/${PROJECT_ID}/${file.name}`,
                    Body: fs.createReadStream(filePath),
                    ContentType: mime.lookup(filePath) || 'application/octet-stream',
                });

                await s3Client.send(command);
            }

            console.log("All files uploaded successfully.");
        } catch (error) {
            console.error("Detailed error:", error);
            throw error;
        }
    } catch (error) {
        console.error("Fatal error during build and upload:", error);
        process.exit(1);
    }
}

async function init() {
    console.log("Starting init...");
    await buildAndUpload();
}

init().catch(err => {
    console.error("Fatal error in init:", err);
    process.exit(1);
});