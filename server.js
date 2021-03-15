const express = require('express')
const socketio = require("socket.io")
const http = require("http")
const CoinbasePro = require('coinbase-pro');
let MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser")


/**
* Server params and init
*/
const app = express()
app.use(bodyParser.json())
const port = 3000
const server = http.Server(app)
const io = socketio(server)

/**
* Init crypto list
*/
const cryptoList = [
    {
        name: 'BTC-EUR',
        values: Array(),
    },
    {
        name: 'ETH-EUR',
        values: Array(),
    },
    {
        name: 'LTC-EUR',
        values: Array(),
    },
]

/**
* Init Coinbase client
*/
const publicClient = new CoinbasePro.PublicClient();

/**
* Init Mongo DB
*/
const mongo = new MongoClient("mongodb://localhost:27017",
    { useNewUrlParser: true, useUnifiedTopology: true });
var ObjectID = require('mongodb').ObjectID;
let db = null;
mongo.connect(err => {
    db = mongo.db("trading")

    /**
    * Test datas
    */
    // const trade = {
    //     crypto: 'BTC-EUR',
    //     purchasedPrice: 49710.46,
    //     sold: false,
    //     purchasedDate: Date.now(),
    // }

    // db.collection('trade').insertOne(trade, (err, docs) => {
    //     console.log(err, docs);
    // })

})

/**
* Express routing
*/
app.use('/css', express.static(__dirname + '/css'))
app.use('/js', express.static(__dirname + '/js'))
app.use('/assets', express.static(__dirname + '/assets'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/html/index.html")
})

/**
 * Retrive and send all trades from datbase
 */
app.get('/list-crypto', (req, res) => {
    db.collection("trade").find().toArray((error, docs) => {
        res.set({
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        });
        console.log(docs)
        res.json(docs)
    })
})

/**
 * Add trade event to add trade in database
 */
app.post("/add", (req, res) => {
    console.log(req.body)
    publicClient
        .getProductOrderBook(req.body.name)
        .then(price => {
            const trade = {
                crypto: req.body.name,
                purchasedPrice: price.asks[0][0],
                sold: false,
                purchasedDate: Date.now(),
            }
            db.collection('trade').insertOne(trade, (err, docs) => {
                console.log(err, docs);
                res.json(trade);
            })
        })
        .catch(error => {
            console.log(error);
        });
})

/**
 * Close trade event to close trade in database
 */
app.post("/close", (req, res) => {
    console.log(req.body)
    publicClient
        .getProductOrderBook(req.body.name)
        .then(price => {
            db.collection("trade")
                .findOneAndUpdate(
                    { _id: ObjectID(req.body.id) },
                    {
                        $set: {
                            "sold": true,
                            "selledPrice": price.asks[0][0],
                        }
                    },
                    { returnOriginal: false },
                )
                .then((obj) => {
                    console.log('updated', obj);
                    res.json(obj.value);
                })
                .catch((err) => {
                    console.log('error mongo ');
                })
        })
        .catch(error => {
            console.log('error close');
        });
})

/**
* Socket
*/
io.on('connect', (socket) => {
    console.log(`Socket server is connected.`);
    socket.emit('message', 'Socket is connected. Ok from server');

    setInterval(() => {
        cryptoList.forEach((crypto) => {
            publicClient
                .getProductOrderBook(crypto.name)
                .then(data => {
                    if (crypto.values.length > 5)
                        crypto.values.pop()
                    crypto.values.unshift(data.asks[0][0])
                    socket.emit('get-price', crypto)
                })
                .catch(error => {
                    console.log(error);
                });
        })
    }, 2000)
})

server.listen(port, () => console.log(`Listening on port ${port}`))