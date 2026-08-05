const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const env = require('dotenv');
const app = express()
var cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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

const JWKS = createRemoteJWKSet(
    new URL('http://localhost:3000/api/auth/jwks')
)
const verifyJWT = async (req, res, next) => {
    const header = req.headers.authorization
    if (!header) {
        return res.status(401).send({ message: "Unauthorized Access" })
    }
    const token = header.split(' ')[1]
    if (!token) {
        return res.status(401).send({ message: "Unauthorized Access" })
    }

    try {
        const { payload } = await jwtVerify(token, JWKS)
        next()

    } catch (error) {
        return res.status(401).send({ message: "Forbidden Access" })
    }

}

const run = async () => {
    try {
        await client.connect();
        const database = client.db('Doc-App');
        const doctorsCollection = database.collection('all-doctors');
        const bookDoctors = database.collection("appointment")
        const usersCollection = database.collection("user")



        // Data Add Api 
        app.post('/all-doctor', async (req, res) => {
            const user = req.body;
            const result = await doctorsCollection.insertOne(user);
            res.send(result);
        });

        // Show all Doctors Data 
        app.get("/all-doctors", async (req, res) => {
            const result = await doctorsCollection.find().toArray();
            res.send(result);
        });

        // Doctors-Details Data

        app.get('/all-doctors/:id', verifyJWT, async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await doctorsCollection.findOne(query);
            res.send(result);
        });

        // Appointment Doctor Api 
        app.post('/appointments', verifyJWT, async (req, res) => {
            const user = req.body;
            const result = await bookDoctors.insertOne(user);
            res.send(result)
        });

        // Appointment api
        app.get('/appointments/:userId', verifyJWT, async (req, res) => {
            const { userId } = req.params;
            const user = await bookDoctors.find({ userId }).toArray()
            res.send(user)
        });

        // Delete Appointment
        app.delete('/appointments/:bookId', verifyJWT, async (req, res) => {
            const { bookId } = req.params
            const user = await bookDoctors.deleteOne({ _id: new ObjectId(bookId) })
            res.send(user)
        });

        // Top Rated Doctors Api
        app.get('/top-doctors', async (req, res) => {
            const result = await doctorsCollection.find().sort({ rating: -1 }).limit(3)
                .toArray();
            res.send(result);
        });

        // Profile Edit Api
        app.patch('/profile/:id', async (req, res) => {
            const { id } = req.params;
            const updateData = req.body;
            const updateUser = await usersCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            )
            res.json(updateUser)
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