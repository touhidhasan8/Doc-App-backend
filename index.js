const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const env = require('dotenv');
const app = express()
var cors = require('cors');
env.config();
app.use(cors());
app.use(express.json())

const port = process.env.PORT
const uri = process.env.MONGODB_URI


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const run = async () => {
    try {
        await client.connect();
        const database = client.db('Doc-App');
        const doctorsCollection = database.collection('all-doctors');
        const bookDoctors = database.collection("appointment")
        // Data Add Api 
        app.post('/all-doctor', async (req, res) => {
            const user = req.body;
            console.log(user)
            const result = await doctorsCollection.insertOne(user);
            res.send(result);
        });

        // Show all Doctors Data 
        app.get("/all-doctors", async (req, res) => {
            const result = await doctorsCollection.find().toArray();
            res.send(result);
        });

        // Doctors-Details Data

        app.get('/all-doctors/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await doctorsCollection.findOne(query);
            res.send(result);
        })

        // Appointment Doctor Api 
        app.post('/appointments', async (req, res) => {
            const user = req.body;
            const result = await bookDoctors.insertOne(user);
            res.send(result)
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})