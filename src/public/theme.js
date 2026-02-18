document.body.style = localStorage.theme ||= "background:radial-gradient(#22A, #112);";

async function jsonFetch(url, noExtension) {
    if (!noExtension) url += '.json';
    const rk = await fetch(url);
    return await rk.json();
}