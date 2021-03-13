const express = require('express')
const socketio = require("socket.io")
const http = require("http")
const CoinbasePro = require('coinbase-pro');
let MongoClient = require("mongodb").MongoClient;

/**
* Server params and init
*/
const app = express()
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

let db = null;
mongo.connect(err => {
    db = mongo.db("trading")
    console.log(db);

    /**
    * Test datas
    */
    const trade = {
        crypto: 'BTC-EUR',
        purchasedPrice: 49710.46,
        sold: false,
        purchasedDate: Date.now(),
    }

    db.collection('trade').insertOne(trade, (err, docs) => {
        console.log(err, docs);
    })

})

/**
* Express routing
*/
app.use('/css', express.static(__dirname + '/css'))
app.use('/js', express.static(__dirname + '/js'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/html/index.html")
})

app.get('/list-crypto', (req, res) => {
    db.collection("trade").find({}).toArray((error, docs) => {
        console.log(docs)
        res.json(docs)
    })
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

    socket.on('order', (data) => {
        console.log(data)
    })
})




// setInterval(() => {
//     io.emit('connected', connected)
//     connected = {}
// }, 2000)



server.listen(port, () => console.log(`Listening on port ${port}`))