const SCRIPT_URL = "PEGAR_AQUI_LA_URL_DE_GOOGLE_APPS_SCRIPT"; 

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const previewContainer = document.getElementById('previewContainer');
const statusMessage = document.getElementById('statusMessage');

let selectedFiles = [];

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    for (let file of files) {
        if (!file.type.startsWith('image/')) continue;
        selectedFiles.push(file);
        
        // Vista previa visual rápida
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
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
    statusMessage.className = 'status-message hidden';

    let successCount = 0;

    for (let file of selectedFiles) {
        try {
            const base64Data = await toBase64(file);
            const base64Clean = base64Data.split(',')[1];

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    base64: base64Clean,
                    type: file.type,
                    name: file.name
                })
            });
            
            const result = await response.json();
            if (result.status === 'success') successCount++;
        } catch (err) {
            console.error(err);
        }
    }

    if (successCount > 0) {
        statusMessage.textContent = `¡Listo! Se subieron ${successCount} fotos exitosamente a la carpeta de Valentina. ✨`;
        statusMessage.className = 'status-message success';
        selectedFiles = [];
        previewContainer.innerHTML = '';
        submitBtn.querySelector('span').textContent = 'Subir más fotos';
    } else {
        statusMessage.textContent = 'Hubo un error al subir las fotos. Inténtalo de nuevo.';
        statusMessage.className = 'status-message error';
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Reintentar';
    }
});

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});
