const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9M1IHk7QeI0RIr2s0ZyNKcHR3ntNgBPaSDZqWUKNz25-PLq5fL1J4QL0xwBErZrt6/exec";

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const previewContainer = document.getElementById('previewContainer');
const statusMessage = document.getElementById('statusMessage');

let selectedFiles = [];

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    for (let file of files) {
        if (!file.type.startsWith('image/')) continue;
        selectedFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${e.target.result}">`;
            previewContainer.appendChild(div);
        }
        reader.readAsDataURL(file);
    }
    if (selectedFiles.length > 0) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = `Subir ${selectedFiles.length} foto(s)`;
    }
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Subiendo recuerdos... 📸';

    let success = true;

    for (let file of selectedFiles) {
        try {
            const base64Data = await new Promise(r => {
                let f = new FileReader();
                f.onload = e => r(e.target.result);
                f.readAsDataURL(file);
            });

            // Creamos un formulario invisible que envía los datos directamente sin pasar por fetch
            await new Promise((resolve, reject) => {
                const iframe = document.createElement('iframe');
                iframe.name = 'hidden_iframe_' + Date.now();
                iframe.style.display = 'none';
                document.body.appendChild(iframe);

                const form = document.createElement('form');
                form.method = 'POST';
                form.action = SCRIPT_URL;
                form.target = iframe.name;

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

                setTimeout(() => {
                    form.remove();
                    iframe.remove();
                    resolve();
                }, 1500);
            });
        } catch (err) {
            success = false;
            console.error(err);
        }
    }

    statusMessage.textContent = "¡Fotos subidas con éxito! Ya están en el Drive de Valentina. ✨";
    statusMessage.className = "status-message success";
    submitBtn.querySelector('span').textContent = "Subir más fotos";
    submitBtn.disabled = false;
    selectedFiles = [];
    previewContainer.innerHTML = '';
});
