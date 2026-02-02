/**
 * Face detection for carousel: get the face center in an image so we can set object-position
 * and keep the face centered in the crop.
 */
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
let modelLoaded = false;

export async function loadFaceModel(): Promise<void> {
  if (modelLoaded) return;
  try {
    await faceapi.tf.setBackend('webgl');
    await faceapi.tf.ready();
    await faceapi.nets.tinyFaceDetector.load(MODEL_URL);
    modelLoaded = true;
  } catch (e) {
    console.warn('Face model load failed:', e);
  }
}

export interface FaceCenter {
  x: number; // 0–1 fraction of image width
  y: number; // 0–1 fraction of image height
}

/**
 * Detect the primary face in an image and return its center as fractions (0–1).
 * Returns null if no face is detected or on error (e.g. CORS).
 */
export async function getFaceCenter(img: HTMLImageElement): Promise<FaceCenter | null> {
  await loadFaceModel();
  if (!modelLoaded) return null;
  try {
    const opts = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.4,
    });
    const detections = await faceapi.detectAllFaces(img, opts).run();
    if (detections.length === 0) return null;
    const box = detections[0].box;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    return {
      x: Math.max(0, Math.min(1, centerX / w)),
      y: Math.max(0, Math.min(1, centerY / h)),
    };
  } catch {
    return null;
  }
}

/**
 * Precompute face center for an image URL by loading the image and running detection.
 */
export function getFaceCenterFromUrl(url: string): Promise<FaceCenter | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      getFaceCenter(img).then(resolve).catch(() => resolve(null));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
