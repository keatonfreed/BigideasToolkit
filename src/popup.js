function sendTabMessage(name, data) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: name, data: data });
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitches = document.querySelectorAll('.toggle-switch')

    function toggleInit(el, name, eventName) {
        el.addEventListener('change', () => {
            let newStorage = {}
            newStorage[name] = el.checked
            chrome.storage.local.set(newStorage);
            sendTabMessage(eventName, el.checked);
        });
    }
    let toggleNames = []
    toggleSwitches.forEach(el => {
        toggleInit(el, el.dataset.name, el.dataset.event)
        toggleNames.push(el.dataset.name)
    })
    // Get saved values from storage and update UI
    chrome.storage.local.get(toggleNames, (results) => {
        toggleSwitches.forEach(el => {
            el.checked = results[el.dataset.name] || false
        })
    });


});
