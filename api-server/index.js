const express = require("express")
const app = express()
const slug = require('random-word-slugs')
const PORT = process.env.PORT || 9000
const {ECSClient,RunTaskCommand} = require("@aws-sdk/client-ecs")
const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})



app.post('/project',async (req,res)=>{
    const {gitUrl} = req.body
    const projectSlug = slug.generateSlug();
    const command = new RunTaskCommand({
        cluster: 'arn:aws:ecs:ap-south-1:222634367486:cluster/builder-cluster-2',
        taskDefinition: 'arn:aws:ecs:ap-south-1:222634367486:task-definition/builder-task',
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: ['subnet-04b18629268e410a8', 'subnet-0ed8b9821c4b9de27'],
                securityGroups: ['sg-09ce8e1176e19a799'],
                assignPublicIp: 'ENABLED'
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: '',
                    environment: [
                        {name: 'GIT_REPOSITORY_URL', value: gitUrl},
                        {name: 'PROJECT_ID', value: projectSlug}
                    ]
                }
            ]
        }
    })
    await ecsClient.send(command);
    return res.json({status: 'queued', data: {projectSlug, url: `http://${projectSlug}.localhost:8000`}})
})
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

