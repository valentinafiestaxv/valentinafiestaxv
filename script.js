const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9M1IHk7QeI0RIr2s0ZyNKcHR3ntNgBPaSDZqWUKNz25-PLq5fL1J4QL0xwBErZrt6/exec";

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const previewContainer = document.getElementById('previewContainer');
const statusMessage = document.getElementById('statusMessage');

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    previewContainer.innerHTML = '';
    for (let file of files) {
        if (!file.type.startsWith('image/')) continue;
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${e.target.result}">`;
            previewContainer.appendChild(div);
        }
        reader.readAsDataURL(file);
    }
    if (files.length > 0) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = `Subir ${files.length} foto(s)`;
    }
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const files = fileInput.files;
    if (files.length === 0) return;

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Preparando fotos... 📸';

    for (let file of files) {
        const base64Data = await new Promise(r => {
            let f = new FileReader();
            f.onload = event => r(event.target.result);
            f.readAsDataURL(file);
        });

        // Creamos un formulario dinámico directo al script de Google
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = SCRIPT_URL;
        form.target = '_blank'; // Se abre una pestaña invisible o rápida que procesa el envío

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = JSON.stringify({
            base64: base64Data.split(',')[1],
            type: file.type,
            name: file.name
        });

        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        form.remove();
    }

    statusMessage.textContent = "¡Proceso finalizado! Revisa tu Google Drive para ver las fotos. ✨";
    statusMessage.className = "status-message success";
    submitBtn.querySelector('span').textContent = "Subir más fotos";
    submitBtn.disabled = false;
    previewContainer.innerHTML = '';
    fileInput.value = '';
});
