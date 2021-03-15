document.addEventListener("DOMContentLoaded", () => {

    const socket = io.connect();

    let trades = null;

    const tradesTable = document.getElementById('crypto-trades-list')
    const closedTradesTable = document.getElementById('crypto-closed-trades-list')

    /**
    * On socket connected
    */
    socket.on('connect', function (data) {
        console.log('socket is connected')
    });

    /**
    * On socket get prices from Coinbase API
    */
    socket.on('get-price', (crypto) => {
        /**
        * Display current price in card
        */
        const cDiv = document.getElementById(crypto.name)
        cDiv.getElementsByClassName('crypto-name')[0].innerHTML = crypto.name
        cDiv.getElementsByClassName('crypto-val')[0].innerHTML = formatPrice(crypto.values[0])

        /**
        * Display prices list evolution
        */
        const cList = cDiv.getElementsByClassName('crypto-list')[0]
        cList.innerHTML = '';
        crypto.values.forEach((element, index) => {
            if (index !== 0) {
                _e(
                    'li',
                    cList,
                    formatPrice(element),
                    [
                        getChangingColor(crypto.values[index + 1], element),
                        'space-y-1',
                        'text-xs'
                    ]
                )
            }
        });

        /**
        * Check gain / loss for all trades and display in trades table
        */
        if (trades != null) {
            trades.forEach((trade) => {
                if (trade.crypto === crypto.name && !trade.sold) {
                    let variation = (parseFloat(crypto.values[0]) - parseFloat(trade.purchasedPrice)) * 100 / parseFloat(crypto.values[0])
                    const currentRow = document.getElementById(trade._id)
                    let currentCell = currentRow.getElementsByClassName('trade-variation')[0]
                    currentCell.innerHTML = '';
                    displayVariation(variation.toFixed(2), currentCell)
                }
            })
        }

    })

    /**
    * Get list of trades
    */
    fetch("/list-crypto", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    })
        .then((res) => res.json())
        .then((list) => {
            trades = list;
            list.forEach(el => {
                el.sold ? displayClosedTrade(el, closedTradesTable) : displayTrade(el, tradesTable)
            });
        })
        .then(() => {
            listenClose()
            listenFilters()
        })

    /**
    * Listener and event for open new trade
    */
    document.querySelectorAll('button.btn-order').forEach((btn) => {
        btn.addEventListener("click", () => {
            let crypto = {
                name: btn.dataset.crypto,
            }
            fetch("/add", {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify(crypto)
            })
                .then((response) => response.json())
                .then((trade) => {
                    displayTrade(trade, tradesTable)
                    trades.push(trade)
                })
                .then(() => {
                    listenClose()
                    listenFilters()
                })
        })
    })

    /**
    * Listener and event for open historic modal
    */
    document.querySelectorAll('button.btn-show-modal').forEach((btn) => {
        btn.addEventListener("click", () => {
            document.getElementById('chart-modal').classList.remove('hide')
            getHistoricRates(btn.dataset.crypto)
        })
    })

    /**
    * Listener and event for close historic modal
    */
    document.querySelector('#chart-modal .close-chart').addEventListener("click", () => {
        document.getElementById('chart-modal').classList.add('hide')
        document.getElementById('chart').innerHTML = ''
    })

    /**
     * Func for listener and event for close a trade
     */
    function listenClose() {
        document.querySelectorAll('button.btn-close-order').forEach((btn) => {
            btn.addEventListener("click", () => {
                let crypto = {
                    id: btn.dataset.key,
                    name: btn.dataset.crypto,
                }
                fetch("/close", {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: "POST",
                    body: JSON.stringify(crypto)
                })
                    .then((response) => response.json())
                    .then((trade) => {
                        var removeIndex = trades.map(function (item) { return item._id; }).indexOf(trade._id);
                        trades.splice(removeIndex, 1)
                        let removeRow = document.getElementById(trade._id);
                        removeRow.remove()
                        displayClosedTrade(trade, closedTradesTable)
                    })
            })
        })
    }

    /**
     * Function to listen currencies filters
     */
    function listenFilters() {
        document.querySelectorAll('button.btn-filter-crypto').forEach((btn) => {
            btn.addEventListener("click", () => {
                const className = btn.dataset.crypto.toLowerCase()
                const tablesRows = document.querySelectorAll('#crypto-trades-list tr, #crypto-closed-trades-list tr')
                tablesRows.forEach((row) => {
                    if (row.classList.contains(className))
                        row.classList.toggle('hide')
                })
            })
        })
    }

    /**
     * Function to get historical data and display in chart
     * @param {string} crypto 
     */
    function getHistoricRates(crypto) {

        fetch("/histo", {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
                name: crypto,
            })
        })
            .then((res) => res.json())
            .then((list) => {

                var options = {
                    series: [{
                        data: []
                    }],
                    chart: {
                        type: 'candlestick',
                        height: 350,
                        toolbar: {
                            show: false,
                        },
                    },
                    title: {
                        text: 'Historique des prix pour ' + crypto,
                        align: 'left'
                    },
                    xaxis: {
                        type: 'datetime'
                    },
                    yaxis: {
                        tooltip: {
                            enabled: true
                        }
                    }
                };

                list.forEach(el => {
                    let objData = {
                        x: null,
                        y: null,
                    }
                    el.pop()
                    objData.x = new Date(el[0] * 1000)
                    objData.y = [el[3], el[2], el[1], el[4]]
                    options.series[0].data.push(objData)
                });

                var chart = new ApexCharts(document.querySelector("#chart"), options);
                chart.render();
            })
    }
})

/**
 * Function to display nex element
 * @param {string} tag 
 * @param {any} parent 
 * @param {string} text 
 * @param {string[]} className 
 * @param {string} id 
 * @param {object[]} dataAttr 
 * @returns 
 */
function _e(tag, parent, text = null, className = null, id = null, dataAttr = null) {
    let element = document.createElement(tag)
    if (text)
        element.appendChild(document.createTextNode(text))
    parent.appendChild(element)
    if (id !== null)
        element.id = id

    if (className !== null)
        element.classList.add(...className)

    if (dataAttr !== null)
        Object.entries(dataAttr).forEach(data => {
            const [key, value] = data
            element.setAttribute(key, value)
        })

    return element
}

/**
 * Function to get price text color evolution
 * @param {float} old 
 * @param {float} now 
 * @returns 
 */
function getChangingColor(old, now) {
    if (now > old)
        return 'text-green-400'
    else if (now < old)
        return 'text-red-400'
    else
        return 'text-gray-400'
}

/**
 * Function to get bg variation color
 * @param {float} color 
 * @returns 
 */
function getVariationColor(color) {
    if (color > 0)
        return 'bg-green-400'
    else if (color < 0)
        return 'bg-red-400'
    else
        return 'bg-gray-400'
}

/**
 * Function to format price with €
 * @param {float} price 
 * @returns 
 */
function formatPrice(price) {
    return price + '€'
}

/**
 * function to display trade in oned trade table
 * @param {object} trade 
 * @param {any} parent 
 */
function displayTrade(trade, parent) {
    const tr = _e(
        'tr',
        parent,
        null,
        [
            'bg-white',
            'lg:hover:bg-gray-100',
            'flex',
            'lg:table-row',
            'flex-row',
            'lg:flex-row',
            'flex-wrap',
            'lg:flex-no-wrap',
            'mb-10',
            'lg:mb-0',
            trade.crypto.toLowerCase(),
        ],
        trade._id
    )

    _e(
        'td',
        tr,
        trade.crypto,
        [
            'w-full',
            'lg:w-auto',
            'p-3',
            'text-gray-800',
            'text-center',
            'border',
            'border-b',
            'block',
            'lg:table-cell',
            'relative',
            'lg:static',
            trade.crypto.toLowerCase(),
        ]
    )

    _e(
        'td',
        tr,
        formatPrice(trade.purchasedPrice),
        [
            'w-full',
            'lg:w-auto',
            'p-3',
            'text-gray-800',
            'text-center',
            'border',
            'border-b',
            'text-center',
            'block',
            'lg:table-cell',
            'relative',
            'lg:static',
        ]
    )

    _e(
        'td',
        tr,
        null,
        [
            'w-full',
            'lg:w-auto',
            'p-3',
            'text-gray-800',
            'text-center',
            'border',
            'border-b',
            'text-center',
            'block',
            'lg:table-cell',
            'relative',
            'lg:static',
            'trade-variation',
        ]
    )

    const action =
        _e(
            'td',
            tr,
            null,
            [
                'w-full',
                'lg:w-auto',
                'p-3',
                'text-gray-800',
                'text-center',
                'border',
                'border-b',
                'text-center',
                'block',
                'lg:table-cell',
                'relative',
                'lg:static',
            ]
        )

    _e(
        'button',
        action,
        'Close',
        [
            'text-white',
            'hover:bg-gray-600',
            'rounded',
            'bg-gray-400',
            'py-1',
            'px-3',
            'text-xs',
            'font-bold',
            'cursor-pointer',
            'btn-close-order'
        ],
        null,
        {
            'data-key': trade._id,
            'data-crypto': trade.crypto
        }

    )
}

/**
 * Function to display closed trades in table
 * @param {object} trade 
 * @param {any} parent 
 */
function displayClosedTrade(trade, parent) {
    trade.variation = getPercent(trade['purchasedPrice'], trade['selledPrice'])
    const tr = _e(
        'tr',
        parent,
        null,
        [
            'bg-white',
            'lg:hover:bg-gray-100',
            'flex',
            'lg:table-row',
            'flex-row',
            'lg:flex-row',
            'flex-wrap',
            'lg:flex-no-wrap',
            'mb-10',
            'lg:mb-0',
            trade.crypto.toLowerCase(),
        ],
        trade._id
    )

    Object.entries(trade).forEach((el) => {
        const [key, value] = el
        if (key === 'crypto' || key === 'purchasedPrice' || key === 'selledPrice' || key === 'variation') {
            const td =
                _e(
                    'td',
                    tr,
                    (key === 'purchasedPrice' || key === 'selledPrice') ? formatPrice(value) : (key === 'variation' ? null : value),
                    [
                        'w-full',
                        'lg:w-auto',
                        'p-3',
                        'text-gray-800',
                        'text-center',
                        'border',
                        'border-b',
                        'block',
                        'lg:table-cell',
                        'relative',
                        'lg:static',
                        'items-center',
                        'justify-center',
                        value.toLowerCase(),
                    ]
                )
            if (key === 'variation') {
                _e(
                    'span',
                    td,
                    value + '%',
                    [
                        'rounded',
                        'py-1',
                        'px-3',
                        'text-xs',
                        'font-bold',
                        'text-gray-100',
                        getVariationColor(value),
                    ]
                )
            }
        }
    })
}

/**
 * Function to display variation in table
 * @param {float} value 
 * @param {any} parent 
 */
function displayVariation(value, parent) {
    _e(
        'span',
        parent,
        value + '%',
        [
            'rounded',
            'py-1',
            'px-3',
            'text-xs',
            'font-bold',
            'text-gray-100',
            getVariationColor(value),
        ]
    )
}

/**
 * Function to get price variation
 * @param {float} buy 
 * @param {float} sell 
 * @returns 
 */
function getPercent(buy, sell) {
    return ((parseFloat(sell) - parseFloat(buy)) * 100 / parseFloat(sell)).toFixed(2)
}
