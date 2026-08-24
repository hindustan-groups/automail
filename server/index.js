require('dotenv').config();
const express = require('express')
const path = require('path')

const cors = require('cors')
require('./db')

const contactrouter = require('./routes/contacts')
const campaignsRouter = require('./routes/campaigns')
const sendRouter = require('./routes/send')
const statsRouter = require('./routes/stats')

const app = express()
const PORT = process.env.PORT || 3000


app.use(express.json())
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, '../client/dist')))

app.use('/api/contacts', contactrouter)
app.use('/api/campaigns', campaignsRouter)
app.use('/api/send', sendRouter)
app.use('/api/stats', statsRouter)


if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))
    app.use((req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'))
    })
}
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`\n🚀 Automail server running on http://localhost:${PORT}`);
        console.log(`📧 Sender: ${process.env.SENDER_EMAIL || 'NOT SET'}`);
        console.log(`⚡ Rate limit: ${process.env.RATE_LIMIT_PER_MINUTE || 5}/min`);
        console.log(`📊 Daily limit: ${process.env.DAILY_LIMIT || 200}\n`);
    });
}

module.exports = app;