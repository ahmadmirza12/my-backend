import { connectDB } from './db/db.js';
import { app } from './app.js';
import dotenv from "dotenv"
import { ensureDefaultAdmin } from './bootstrap/seed.js'

dotenv.config({
    path:"./.env"
})




const port = process.env.PORT || 8000
app.listen(port, () => {
    console.log(`SERVER IS RUNNING ON ${port}`)
})
connectDB()
.then(async (ok) => {
    if (ok) {
        await ensureDefaultAdmin()
    }
})
.catch((err) => {
    console.log("SERVER IS NOT CONNECTED", err)
});