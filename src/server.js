import { connectDB } from './db/db.js';
import { app } from './app.js';
import dotenv from "dotenv"
import { ensureDefaultAdmin } from './bootstrap/seed.js'

dotenv.config({
    path:"./.env"
})




connectDB()
.then(async () => {
    await ensureDefaultAdmin()
    app.listen(process.env.PORT,()=>{
        console.log(`SERVER IS RUNNING ON ${process.env.PORT}`)
    })
}).catch((err) => {
    console.log("SERVER IS NOT CONNECTED",err)
});