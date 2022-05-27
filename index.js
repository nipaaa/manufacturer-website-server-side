const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1aie3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}


const verifyAdmin = async (req, res, next) => {
  const requester = req.decoded.email;
  const requesterAccount = await userCollection.findOne({ email: requester });
  if (requesterAccount.role === 'admin') {
    next();
  }
  else {
    res.status(403).send({ message: 'forbidden' });
  }
}



async function run(){
    try{
        await client.connect();
        const partsCollection = client.db('manufacturer_website').collection('parts');
        const userCollection = client.db('manufacturer_website').collection('user');
        const orderCollection = client.db('manufacturer_website').collection('order');
        const paymentCollection = client.db('manufacturer_website').collection('payment');

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

        app.get('/user', async (req, res) => {
          const users = await userCollection.find().toArray();
          res.send(users);
        });


        app.get('/admin/:email', async (req, res) => {
          const email = req.params.email;
          const user = await userCollection.findOne({ email: email });
          const isAdmin = user.role === 'admin';
          res.send({ admin: isAdmin })
        });

        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
          const email = req.params.email;
          const filter = { email: email };
          const updateDoc = {
            $set: { role: 'admin' },
          };
          const result = await userCollection.updateOne(filter, updateDoc);
          res.send(result);
        });


        app.put('/user/:email', async (req, res) => {
          const email = req.params.email;
          const user = req.body;
          const filter = { email: email };
          const options = { upsert: true };
          const updateDoc = {
            $set: user,
          };
          const result = await userCollection.updateOne(filter, updateDoc, options);
          const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' })
          res.send({ result, token });
        });





        //get all orders
        app.get('/orders', verifyJWT, verifyAdmin, async (req, res) => {
          const orders = await orderCollection.find().toArray()
          res.send(orders)
      })

      //getting my orders by filtering email
      app.get('/order', verifyJWT, async (req, res) => {
          const email = req.query.email
          const decodedEmail = req.decoded.email
          if (email === decodedEmail) {
              const query = { email: email }
              const orders = await orderCollection.find(query).toArray()
              res.send(orders)
          }
          else {
              return res.status(403).send({ message: 'Forbidden accsess' })
          }
      })

      //get order by id
      app.get('/order/:id', verifyJWT, async (req, res) => {
          const id = req.params.id
          const query = { _id: ObjectId(id) }
          const order = await orderCollection.findOne(query)
          res.send(order)
      })

      //update order with payment info
      app.patch('/order/:id', verifyJWT, async (req, res) => {
          const id = req.params.id;
          const payment = req.body;
          const filter = { _id: ObjectId(id) };
          const updatedDoc = {
              $set: {
                  paid: true,
                  transactionId: payment.transactionId
              }
          }

          const result = await paymentCollection.insertOne(payment);
          const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
          res.send(updatedOrder);
      })

      //update paid order status to shipped
      app.put('/order/:id', verifyJWT, verifyAdmin, async (req, res) => {
          const id = req.params.id;
          const updatedStatus = req.body;
          const filter = { _id: ObjectId(id) };
          const updatedDoc = {
              $set: {
                  shipped: true
              }
          }
          const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
          res.send(updatedOrder);
      })

      //delete order
      app.delete('/order/:id', verifyJWT, async (req, res) => {
          const id = req.params.id
          const filter = { _id: ObjectId(id) }
          const result = await orderCollection.deleteOne(filter)
          res.send(result)
      })



      //create part
      app.post('/part', verifyJWT, verifyAdmin, async (req, res) => {
        const part = req.body
        const result = await partsCollection.insertOne(part)
        res.send(result)
    })


    //delete part
    app.delete('/part/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const filter = { _id: ObjectId(id) }
      const result = await partsCollection.deleteOne(filter)
      res.send(result)
  })





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