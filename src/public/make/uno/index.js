(async function() {
    'use strict';

    const settings = [
        ...await jsonFetch('/data/defaultSettings'),
        ...await jsonFetch('/data/uno/settings')
    ];
    const submitButton = config.lastElementChild;
    submitButton.remove();

    for (const field of settings) {
        const fieldElement = document.createElement('span');
        fieldElement.innerText = field.title;
        let input;
        if (field.type === 'select') {
            input = fieldElement.appendChild(document.createElement('select'));
        } else {
            input = fieldElement.appendChild(document.createElement('input'));
            input.type = field.type;
        }
        input.name = field.name;
        switch (field.type) {
            case 'number':
                if ('step' in field) input.step = field.step;
                if ('min' in field) input.min = field.min;
                if ('max' in field) input.max = field.max;
                if ('value' in field) input.value = field.value;
                break;
            case 'text':
                if ('maxlength' in field) input.maxlength = field.maxlength;
                if ('value' in field) input.value = field.value;
                break;
            case 'checkbox':
                if ('value' in field) input.checked = field.value;
                break;
            case 'select':
                for (const value of field.options) {
                    const option = input.appendChild(document.createElement('option'));
                    option.value = option.innerText = value;
                }
                if ('value' in field) input.selectedIndex = field.value;
                break;
        }
        config.append(fieldElement, document.createElement('br'));
    }
    config.appendChild(submitButton);
})();