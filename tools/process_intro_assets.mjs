import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/ayush/.gemini/antigravity-ide/brain/53dd1530-a585-409d-bab5-5e9d019181dd';
const OUT_DIR = '/Users/ayush/Downloads/lost and found/public/gate';

async function processKey1() {
  const inputPath = path.join(ARTIFACT_DIR, 'brass_key_texture_1790527869218.jpg');
  // Crop to y: 345 to 650
  const image = sharp(inputPath);
  const cropped = await image.extract({ left: 60, top: 345, width: 890, height: 305 }).toBuffer();
  
  const { data, info } = await sharp(cropped).raw().toBuffer({ resolveWithObject: true });
  const outBuffer = Buffer.alloc(info.width * info.height * 4);
  
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    const maxVal = Math.max(r, g, b);
    
    let alpha = 255;
    if (maxVal <= 24) {
      alpha = 0;
    } else if (maxVal < 45) {
      alpha = Math.round(((maxVal - 24) / 21) * 255);
    }
    
    outBuffer[i * 4] = r;
    outBuffer[i * 4 + 1] = g;
    outBuffer[i * 4 + 2] = b;
    outBuffer[i * 4 + 3] = alpha;
  }
  
  await sharp(outBuffer, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'key_1.png'));
  console.log('Processed key_1.png');
}

async function processKey2() {
  const inputPath = path.join(ARTIFACT_DIR, 'brass_key_alt_1790527888973.jpg');
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const outBuffer = Buffer.alloc(info.width * info.height * 4);
  
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    const maxVal = Math.max(r, g, b);
    
    let alpha = 255;
    if (maxVal <= 20) {
      alpha = 0;
    } else if (maxVal < 40) {
      alpha = Math.round(((maxVal - 20) / 20) * 255);
    }
    
    outBuffer[i * 4] = r;
    outBuffer[i * 4 + 1] = g;
    outBuffer[i * 4 + 2] = b;
    outBuffer[i * 4 + 3] = alpha;
  }
  
  await sharp(outBuffer, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'key_2.png'));
  console.log('Processed key_2.png');
}

async function processKey3() {
  const inputPath = path.join(ARTIFACT_DIR, 'brass_key_skeleton_1790528001503.jpg');
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const outBuffer = Buffer.alloc(info.width * info.height * 4);
  
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    const maxVal = Math.max(r, g, b);
    
    let alpha = 255;
    if (maxVal <= 20) {
      alpha = 0;
    } else if (maxVal < 40) {
      alpha = Math.round(((maxVal - 20) / 20) * 255);
    }
    
    outBuffer[i * 4] = r;
    outBuffer[i * 4 + 1] = g;
    outBuffer[i * 4 + 2] = b;
    outBuffer[i * 4 + 3] = alpha;
  }
  
  await sharp(outBuffer, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'key_3.png'));
  console.log('Processed key_3.png');
}

async function processHardware() {
  const inputPath = path.join(ARTIFACT_DIR, 'door_knob_hardware_1790527910723.jpg');
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const outBuffer = Buffer.alloc(info.width * info.height * 4);
  
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    const maxVal = Math.max(r, g, b);
    
    let alpha = 255;
    if (maxVal <= 18) {
      alpha = 0;
    } else if (maxVal < 36) {
      alpha = Math.round(((maxVal - 18) / 18) * 255);
    }
    
    outBuffer[i * 4] = r;
    outBuffer[i * 4 + 1] = g;
    outBuffer[i * 4 + 2] = b;
    outBuffer[i * 4 + 3] = alpha;
  }
  
  await sharp(outBuffer, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'door_hardware.png'));
  console.log('Processed door_hardware.png');
}

async function run() {
  await processKey1();
  await processKey2();
  await processKey3();
  await processHardware();
  console.log('Done!');
}

run().catch(console.error);
