const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Camera access
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream);

// Capture image
function capture() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  processImage();
}

// Computer Vision Processing
function processImage() {
  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  let edges = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
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

  let rect = cv.boundingRect(maxContour);

  // Assume water level is 70% (demo approximation)
  let glassHeight = rect.height;
  let waterHeight = glassHeight * 0.7;

  let radius = rect.width / 2;

  // Volume calculation
  let volume = Math.PI * radius * radius * waterHeight;
  let liters = volume / 1000000;
  let grams = volume / 1000;

  document.getElementById("result").innerHTML =
    `Estimated Water Volume: ${grams.toFixed(0)} ml <br>
     Water in Liters: ${liters.toFixed(2)} L <br>
     Water Weight: ${grams.toFixed(0)} grams`;

  src.delete(); gray.delete(); edges.delete();
}
