const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz58Q4JqHuFF_iGwk_Rtr4NVXRhTwXH7OBGCPXNm_WRBodVwQ9H3AXWPr-vcWXFhTdfUA/exec"; 

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const previewContainer = document.getElementById('previewContainer');
const statusMessage = document.getElementById('statusMessage');
const guestNameInput = document.getElementById('guestName');

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
        if (file.type && !file.type.startsWith('image/')) continue;
        
        selectedFiles.push(file);
        
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

    // Recoger y formatear el nombre o apodo
    let guestName = guestNameInput.value.trim();
    if (guestName === "") {
        guestName = "Fiesta";
    } else {
        guestName = guestName.replace(/\s+/g, '_');
    }

    try {
        // Subida en paralelo: Todas las fotos se envían al mismo tiempo
        const uploadPromises = selectedFiles.map(async (file) => {
            const base64Data = await toBase64(file);
            const base64Clean = base64Data.split(',')[1]; 

            const formData = new URLSearchParams();
            formData.append('base64', base64Clean);
            formData.append('type', file.type || 'image/jpeg');
            formData.append('name', guestName);

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            return result.status === 'success';
        });

        // Esperar a que terminen de enviarse todas de golpe
        const results = await Promise.all(uploadPromises);
        const successCount = results.filter(Boolean).length;

        if (successCount > 0) {
            statusMessage.textContent = `¡Listo! Se subieron ${successCount} fotos exitosamente a la carpeta de Valentina. ✨`;
            statusMessage.className = 'status-message success';
            selectedFiles = [];
            previewContainer.innerHTML = '';
            submitBtn.querySelector('span').textContent = 'Subir más fotos';
        } else {
            throw new Error("Ninguna foto pudo ser procesada.");
        }

    } catch (err) {
        console.error("Error subiendo archivos:", err);
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
