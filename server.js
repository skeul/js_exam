const express = require('express')
const socketio = require("socket.io")
const http = require("http")
const CoinbasePro = require('coinbase-pro');

/**
* Server params and init
*/
const app = express()
const port = 3000
const server = http.Server(app)
const io = socketio(server)

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
const publicClient = new CoinbasePro.PublicClient();

/**
* Express routing
*/

app.use('/css', express.static(__dirname + '/css'))
app.use('/js', express.static(__dirname + '/js'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/html/index.html")
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