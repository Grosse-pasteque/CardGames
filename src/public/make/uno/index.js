(async function() {
    'use strict';

    const settings = await jsonFetch('/games/uno/settings.json');
    const submitButton = config.lastElementChild;
    submitButton.remove();

    for (const { title, name, type, attributes } of settings) {
        const field = document.createElement('span');
        field.innerText = title;
        const input = field.appendChild(document.createElement('input'));
        input.type = type;
        input.name = name;
        for (const { name, value } of attributes)
            input[name] = value;
        config.append(field, document.createElement('br'));
    }
    config.appendChild(submitButton);

    async function jsonFetch(...args) {
        const rk = await fetch(...args);
        return await rk.json();
    }
})();