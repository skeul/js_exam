# Crypto Trading Training App

This app allows you to practice trading on the 3 main cryptocurrencies:
- Bitcoin
- Ethereum
- Litecoin

The prices of these cryptocurrencies are in Euros.

This project was done within the framework of my bachelor’s degree DIM, class 2020/2021

<br>

## Installation
It's a node project.
After cloning the project, you must install the dependencies. 

    $ npm install

## Project dependencies
This project needs the following dependencies to work :

    "coinbase-pro": "^0.9.0",
    "express": "^4.17.1",
    "mongodb": "^3.6.4",
    "nodemon": "^2.0.7",
    "socket.io": "^4.0.0"

The project also use [Tailwindcss](https://tailwindcss.com/) framework and [Apexchart.js](https://apexcharts.com/).

To run the project you need to install [Mongodb](https://docs.mongodb.com/manual/installation/).

## Running app
Once the dependencies are installed, you need to start the project with cmd :

    $ nodemon serve

And you can access the application through the following url [http://localhost:3000](http://localhost:3000/).

The server port(3000) and the mongodb port(27017) is set in config.js
