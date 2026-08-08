const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGBJcFjnwyspm1GUlX4EYYZorBcOGRGKuSvdxDJpZdxDI6UC6PZPV1RHG8GFU0Dg-30w/exec"; 

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const previewContainer = document.getElementById('previewContainer');
const statusMessage = document.getElementById('statusMessage');
const guestNameInput = document.getElementById('guestName');

let selectedFiles = [];

console.log("👉 1. El script se ha cargado correctamente.");

dropZone.addEventListener('click', () => {
    console.log("👉 2. Hicieron clic en la zona de carga.");
    fileInput.click();
});

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
    console.log("👉 3. Soltaron archivos mediante drag & drop.");
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    console.log("👉 3. Seleccionaron archivos mediante el explorador.");
    handleFiles(e.target.files);
});

function handleFiles(files) {
    for (let file of files) {
        if (file.type && !file.type.startsWith('image/')) {
            console.log("⚠️ Archivo ignorado porque no es imagen:", file.name);
            continue;
        }
        
        selectedFiles.push(file);
        console.log("📸 Foto agregada a la lista:", file.name);
        
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
        console.log("👉 4. Botón habilitado. Total de fotos listas:", selectedFiles.length);
    }
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("👉 5. Se presionó el botón de 'Subir recuerdos'. Iniciando proceso...");
    
    if (selectedFiles.length === 0) {
        console.log("⚠️ No hay archivos seleccionados.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Subiendo recuerdos... 📸';
    statusMessage.className = 'status-message hidden';

    let successCount = 0;

    let guestName = guestNameInput.value.trim();
    if (guestName === "") {
        guestName = "Fiesta";
    } else {
        guestName = guestName.replace(/\s+/g, '_');
    }
    console.log("👉 6. Nombre que se usará para las fotos:", guestName);

    for (let i = 0; i < selectedFiles.length; i++) {
        let file = selectedFiles[i];
        console.log(`👉 7. Procesando foto ${i + 1} de ${selectedFiles.length}:`, file.name);

        try {
            const base64Data = await toBase64(file);
            const base64Clean = base64Data.split(',')[1];
            console.log("👉 8. Foto convertida a Base64 con éxito.");

            const formData = new URLSearchParams();
            formData.append('base64', base64Clean);
            formData.append('type', file.type || 'image/jpeg');
            formData.append('name', guestName);

            console.log("👉 9. Enviando petición fetch a Google Apps Script...");
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
            
            console.log("👉 10. Respuesta recibida del servidor de Google. Analizando JSON...");
            const result = await response.json();
            console.log("👉 11. Resultado del servidor:", result);

            if (result.status === 'success') {
                successCount++;
                console.log("✅ Foto subida exitosamente.");
            } else {
                console.error("❌ Google rechazó la foto:", result.message);
            }
        } catch (err) {
            console.error("❌ EXCREPCIÓN CACHADA EN EL FETCH:", err);
            alert("Error técnico detallado: " + err.message);
        }
    }

    if (successCount > 0) {
        console.log(`🎉 Proceso terminado. Fotos subidas con éxito: ${successCount}`);
        statusMessage.textContent = `¡Listo! Se subieron ${successCount} fotos exitosamente a la carpeta de Valentina. ✨`;
        statusMessage.className = 'status-message success';
        selectedFiles = [];
        previewContainer.innerHTML = '';
        submitBtn.querySelector('span').textContent = 'Subir más fotos';
    } else {
        console.log("❌ Ninguna foto pudo ser subida.");
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
