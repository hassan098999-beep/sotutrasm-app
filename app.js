const input = document.getElementById('inputText');
const saveBtn = document.getElementById('saveBtn');
const output = document.getElementById('output');

saveBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if(text){
        output.textContent = ;
        input.value = '';
    } else {
        output.textContent = 'Veuillez écrire quelque chose avant de cliquer';
    }
});

if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker enregistré'))
    .catch(err => console.log('Erreur SW:', err));
}
