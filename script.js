const SCRIPT_URL = "https://script.google.com/macros/library/d/1Io7k2y-hdam_3C22HTcaLKux-KIQSxurJRIU6OeFG8V88OFgQm9dS84C/6"; 

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
        // Validar que sea imagen, si es iPhone a veces el tipo está vacío, lo dejamos pasar si no es explícitamente otro formato
        if (file.type && !file.type.startsWith('image/')) continue;
        
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
            const base64Clean = base64Data.split(',')[1]; // Quitar cabecera de la imagen

            // Usar URLSearchParams es el truco para que Google no bloquee la petición
            const formData = new URLSearchParams();
            formData.append('base64', base64Clean);
            formData.append('type', file.type || 'image/jpeg');
            formData.append('name', file.name || 'foto');

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            if (result.status === 'success') successCount++;
        } catch (err) {
            console.error("Error subiendo archivo:", err);
        }
    }

    if (successCount > 0) {
        statusMessage.textContent = `¡Listo! Se subieron ${successCount} fotos exitosamente a la carpeta de Valentina. ✨`;
        statusMessage.className = 'status-message success';
        selectedFiles = [];
        previewContainer.innerHTML = '';
        submitBtn.querySelector('span').textContent = 'Subir más fotos';
    } else {
        statusMessage.textContent = 'Hubo un error al subir las fotos. Revisa tu conexión.';
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
