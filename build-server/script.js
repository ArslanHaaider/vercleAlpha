const {exec} = require("child_process")
const {S3Client, PutObjectCommand} = require("@aws-sdk/client-s3")
const mime = require('mime-types')
const path = require("path")
const fs = require('fs')
const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: '<YOUR_AwsAccessKey_HERE>',
        secretAccessKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    }
})
const PROJECT_ID = process.env.PROJECT_ID;
async function init() {
    console.log("executing script.js")

    const outDirPath  = path.join(_dirname,'output')

    const p = exec(`cd ${outDirPath} && npm install && npm run build`) 

    p.stdout.on('data', (data) => {
        console.log(data.toString())
    })

    p.stdout.on('error', (error) => {
        console.log(error.toString())
    })

    p.stdout.on('close', async () => {
        console.log("Build completed")
        const distFolderPath = path.join(outDirPath, 'dist')
        const distFolderContents = fs.readdirSync(distFolderPath, {recursive: true})
        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file)
            if (fs.lstatSync(filePath).isDirectory()) continue
            console.log(filePath)
            const command = new PutObjectCommand({
                Bucket: 'XXXXXXXXXXXX',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            })
            await s3Client.send(command)
        }
        console.log("Done")
    })  

}



