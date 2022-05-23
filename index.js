const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectID } = require('bson');

const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvpcq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toolCollection = client.db('tools_provita').collection('tools');

        // all data load
        app.get('/tool', async (req, res) => {
            const query = {};
            const cursor = toolCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get("/tool/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectID(id) }
            const tool = await toolCollection.findOne(query);
            res.send(tool);
        });

    }
    finally { }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Manufacturer Server On !')
})

app.listen(port, () => {
    console.log(`Manufacturer app listening on port ${port}`)
})