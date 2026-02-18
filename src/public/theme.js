document.body.style = localStorage.theme ||= "background:radial-gradient(#22A, #112);";

async function jsonFetch(...args) {
    const rk = await fetch(...args);
    return await rk.json();
}