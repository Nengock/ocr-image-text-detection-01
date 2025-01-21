import './style.css';
import { createWorker } from 'tesseract.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-center">OCR Text Detection</h1>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <input 
          type="file" 
          id="imageInput"
          accept="image/*"
          class="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        >
        
        <div id="imageContainer" class="mt-8 relative">
          <canvas id="outputCanvas" class="w-full"></canvas>
        </div>
        
        <div id="textResults" class="mt-4 space-y-2"></div>
      </div>
    </div>
  </div>
`;

let worker = null;

async function initializeWorker() {
  worker = await createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
}

function showLoading() {
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.id = 'loading';
  loading.innerHTML = 'Processing image...';
  document.body.appendChild(loading);
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.remove();
  }
}

async function processImage(file) {
  const canvas = document.getElementById('outputCanvas');
  const ctx = canvas.getContext('2d');
  const textResults = document.getElementById('textResults');
  
  // Load image
  const img = new Image();
  img.src = URL.createObjectURL(file);
  
  await new Promise((resolve) => {
    img.onload = resolve;
  });
  
  // Set canvas dimensions to match image
  canvas.width = img.width;
  canvas.height = img.height;
  
  // Draw original image
  ctx.drawImage(img, 0, 0);
  
  showLoading();
  
  try {
    // Perform OCR
    const result = await worker.recognize(img);
    
    // Clear previous results
    textResults.innerHTML = '';
    
    // Draw boxes and display text
    result.data.words.forEach((word, index) => {
      const { bbox } = word;
      const { x0, y0, x1, y1 } = bbox;
      
      // Draw rectangle
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      
      // Add text result
      const textElement = document.createElement('div');
      textElement.className = 'p-2 bg-gray-50 rounded';
      textElement.textContent = 'Text ' + (index + 1) + ': ' + word.text;
      textResults.appendChild(textElement);
    });
  } catch (error) {
    console.error('Error processing image:', error);
    alert('Error processing image. Please try again.');
  } finally {
    hideLoading();
  }
}

// Initialize worker
initializeWorker();

// Set up file input handler
const imageInput = document.getElementById('imageInput');
imageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await processImage(file);
  }
});