document.addEventListener("DOMContentLoaded", () => {

    const socket = io.connect();

    let cryptos;
    let trades = null;

    const tradesTable = document.getElementById('crypto-trades-list')
    const closedTradesTable = document.getElementById('crypto-closed-trades-list')

    socket.on('connect', function (data) {
        console.log('socket is connected')
    });

    socket.on('get-price', (crypto) => {
        cryptos = crypto;
        const cDiv = document.getElementById(crypto.name)
        cDiv.getElementsByClassName('crypto-name')[0].innerHTML = crypto.name
        cDiv.getElementsByClassName('crypto-val')[0].innerHTML = formatPrice(crypto.values[0])
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
                        'space-y-2'
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
                    // console.log(currentRow);
                    let currentCell = currentRow.getElementsByClassName('trade-variation')[0]
                    currentCell.innerHTML = variation.toFixed(2) + '%';
                    currentCell.classList.remove('bg-green-100', 'bg-red-100')
                    if (variation.toFixed(2) > 0)
                        currentCell.classList.add('bg-green-100')
                    else if (variation.toFixed(2) < 0)
                        currentCell.classList.add('bg-red-100')
                }
            })
        }

    })

    fetch("/list-crypto")
        .then((res) => res.json())
        .then((list) => {
            trades = list;
            list.forEach(el => {
                el.sold ? displayClosedTrade(el, closedTradesTable) : displayTrade(el, tradesTable)
            });
        })
        .then(() => {
            listenClose();
        })

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
                    console.log(trade)
                })
                .then(() => {
                    listenClose();
                })
        })
    })

    function listenClose() {
        document.querySelectorAll('button.btn-close-order').forEach((btn) => {
            btn.addEventListener("click", () => {
                console.log(btn.dataset.key);
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
                        console.log(trades);
                        var removeIndex = trades.map(function (item) { return item._id; }).indexOf(trade._id);
                        trades.splice(removeIndex, 1)
                        console.log(trades);
                        let removeRow = document.getElementById(trade._id);
                        removeRow.remove()
                        displayClosedTrade(trade, closedTradesTable)
                    })
            })
        })
    }
})

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

function getChangingColor(old, now) {
    if (now > old)
        return 'text-green-400'
    else if (now < old)
        return 'text-red-400'
    else
        return 'text-gray-400'
}

function formatPrice(price) {
    return price + '€'
}

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
        ]
    )

    _e(
        'td',
        tr,
        trade.purchasedPrice,
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
        ],
        trade._id
    )

    Object.entries(trade).forEach((el) => {
        const [key, value] = el
        if (key === 'crypto' || key === 'purchasedPrice' || key === 'selledPrice' || key === 'variation') {
            console.log(key);
            _e(
                'td',
                tr,
                key === 'variation' ? value + '%' : value,
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
                ]
            )
        }
    })
}

function getPercent(buy, sell) {
    return ((parseFloat(sell) - parseFloat(buy)) * 100 / parseFloat(sell)).toFixed(2)
}
