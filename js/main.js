document.addEventListener("DOMContentLoaded", () => {

    const socket = io.connect();

    let cryptos;

    const tradesTable = document.getElementById('crypto-trades-list')
    console.log(tradesTable);
    socket.on('connect', function (data) {
        console.log('socket is connected')
    });

    socket.on('message', (data) => {
        console.log(data);
    })

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

    })

    fetch("/list-crypto")
        .then((res) => res.json())
        .then((list) => {
            list.forEach(el => {
                displayTrade(el, tradesTable)
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
                        displayTrade(trade, tradesTable)
                        console.log(trade)
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
        ]
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
        '10€',
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
            'hover:bg-red-600',
            'rounded',
            'bg-red-400',
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