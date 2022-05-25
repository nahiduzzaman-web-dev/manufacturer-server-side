const express = require('express')
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectID } = require('bson');

const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvpcq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });

    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        await client.connect();
        const toolCollection = client.db('tools_provita').collection('tools');
        const purchaseCollection = client.db('tools_provita').collection('purchase');
        const userCollection = client.db('tools_provita').collection('user');

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

        app.post("/purchase", async (req, res) => {
            const purchase = req.body;
            const result = await purchaseCollection.insertOne(purchase);
            res.send(result);
        });

        // dashboard
        app.get("/order", verifyJWT, async (req, res) => {
            const orderEmail = req.query.orderEmail;
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail);
            if (orderEmail === decodedEmail) {
                const query = { orderEmail: orderEmail };
                const orders = await purchaseCollection.find(query).toArray();
                res.send(orders);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }
        })

        // user
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.SECRET_TOKEN, { expiresIn: '24hr' });
            res.send({ result, token });
        });

        // user for dashboard
        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });
        // admin
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        }
        );
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