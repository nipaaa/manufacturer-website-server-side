const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1aie3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run(){
    try{
        await client.connect();
        const partsCollection = client.db('manufacturer_website').collection('parts');


        app.get('/parts' , async(req, res) =>{
            const query = {};
            const cursor = partsCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        });


        app.get('/parts/:id' , async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const part = await partsCollection.findOne(query);
            res.send(part);
        });

    }

    finally{

    }

}

run().catch(console.dir);






app.get('/', (req, res) => {
  res.send('Hello from parts manufacturer!')
})

app.listen(port, () => {
  console.log(`manufacturer app listening on port ${port}`)
})