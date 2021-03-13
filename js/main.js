document.addEventListener("DOMContentLoaded", () => {

    const socket = io.connect();

    socket.on('connect', function (data) {
        console.log('socket is connected')
    });

    socket.on('message', (data) => {
        console.log(data);
    })

    socket.on('get-price', (crypto) => {
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

    document.querySelectorAll('button.btn-order').forEach((btn) => {
        btn.addEventListener("click", () => {
            console.log(btn.dataset.crypto);
            socket.emit('order', btn.dataset.crypto);
        })
    })


})

function _e(tag, parent, text = null, className = null, id = null) {
    let element = document.createElement(tag)
    if (text)
        element.appendChild(document.createTextNode(text))
    parent.appendChild(element)
    if (id !== null)
        element.id = id

    if (className !== null)
        element.classList.add(...className)

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
