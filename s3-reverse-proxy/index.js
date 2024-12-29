const express = require("express")
const httpProxy = require("http-proxy")
const app = express()

const PORT = process.env.PORT || 8000

const BasePath = "https://vercel-alpha.s3.ap-south-1.amazonaws.com/__outputs"

const proxy = httpProxy.createProxy();
app.use((req,res)=>{
    const hostname = req.hostname
    console.log(hostname)
    const subDomain = hostname.split('.')[0];
    const resolvesTo = `${BasePath}/${subDomain}`
    console.log(resolvesTo)
    return proxy.web(req, res, {target: resolvesTo,changeOrigin:true})

})
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

