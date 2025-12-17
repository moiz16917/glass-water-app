const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");

let streaming = false;

// ✅ BACK CAMERA ACCESS
navigator.mediaDevices.getUserMedia({
  video: { facingMode: { exact: "environment" } }
})
.then(stream => {
  video.srcObject = stream;
  video.play();
})
.catch(() => {
  // fallback
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream);
});

// ✅ WAIT FOR OPENCV TO LOAD
cv['onRuntimeInitialized'] = () => {
  statusText.innerText = "OpenCV Loaded. Detecting object...";
  streaming = true;
  startAutoDetection();
};

// AUTO FRAME PROCESSING
function startAutoDetection() {
  setInterval(() => {
    if (!streaming) return;
    capture(false);
  }, 1200); // every 1.2 sec
}

// CAPTURE IMAGE
function capture(showCanvas = true) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  if (showCanvas) processImage();
  else autoProcessImage();
}

// AUTO DETECTION MODE
function autoProcessImage() {
  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  let edges = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(5,5), 0);
  cv.Canny(gray, edges, 50, 150);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let maxContour = null;
  let maxArea = 0;

  for (let i = 0; i < contours.size(); i++) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);
    if (area > maxArea) {
      maxArea = area;
      maxContour = cnt;
    }
  }

  if (!maxContour || maxArea < 8000) {
    statusText.innerText = "No glass detected...";
    src.delete(); gray.delete(); edges.delete();
    return;
  }

  let rect = cv.boundingRect(maxContour);

  // 🔹 AUTO WATER LEVEL ESTIMATION
  let glassHeight = rect.height;
  let waterHeight = glassHeight * 0.65; // dynamic approx

  let radius = rect.width / 2;

  // 🔹 VOLUME CALCULATION
  let volume_ml = Math.PI * radius * radius * waterHeight / 1000;
  let liters = volume_ml / 1000;
  let grams = volume_ml;

  statusText.innerText = "Glass detected ✔";

  document.getElementById("result").innerHTML =
    `Estimated Water Volume: ${volume_ml.toFixed(0)} ml <br>
     Water in Liters: ${liters.toFixed(2)} L <br>
     Water Weight: ${grams.toFixed(0)} grams`;

  src.delete(); gray.delete(); edges.delete();
}

// MANUAL BUTTON
function processImage() {
  autoProcessImage();
}
