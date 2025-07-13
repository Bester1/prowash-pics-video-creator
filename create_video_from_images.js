const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();
const https = require('https');
const http = require('http');

// Configuration
const config = {
  imagesDir: process.env.IMAGES_DIR || '.',
  audioDir: process.env.AUDIO_DIR || './audio',
  outputVideo: process.env.OUTPUT_VIDEO || 'output_video.mp4',
  numImages: parseInt(process.env.NUM_IMAGES) || 5,
  minDuration: parseInt(process.env.MIN_DURATION) || 5,
  maxDuration: parseInt(process.env.MAX_DURATION) || 10,
  doneDir: process.env.DONE_DIR || './done',
  downloadVideo: process.env.DOWNLOAD_VIDEO === 'true'
};

// Helper to get random elements from an array
function getRandomElements(arr, n) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// Helper to download video from URL (optional)
function downloadVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(outputPath);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

// Validate directories exist
if (!fs.existsSync(config.imagesDir)) {
  console.error(`Images directory '${config.imagesDir}' does not exist.`);
  process.exit(1);
}
if (!fs.existsSync(config.audioDir)) {
  console.error(`Audio directory '${config.audioDir}' does not exist.`);
  process.exit(1);
}

// Get image files (jpg, jpeg, png)
const imageFiles = fs.readdirSync(config.imagesDir).filter(f =>
  f.match(/\.(jpg|jpeg|png)$/i)
);
if (imageFiles.length < config.numImages) {
  console.error(`Not enough images. Found ${imageFiles.length}, need ${config.numImages}.`);
  console.log('Available images:', imageFiles);
  process.exit(1);
}
const selectedImages = getRandomElements(imageFiles, config.numImages);
console.log('Selected images:', selectedImages);

// Get audio files (mp3)
const audioFiles = fs.readdirSync(config.audioDir).filter(f => f.match(/\.mp3$/i));
if (audioFiles.length === 0) {
  console.error(`No audio files found in audio directory '${config.audioDir}'.`);
  process.exit(1);
}
const selectedAudio = getRandomElements(audioFiles, 1)[0];
console.log('Selected audio:', selectedAudio);

// Random duration between min and max
const duration = Math.floor(Math.random() * (config.maxDuration - config.minDuration + 1)) + config.minDuration;
console.log('Video duration:', duration, 'seconds');

// IMPORTANT: json2video requires remote URLs, not local files!
const imageDuration = Math.max(1, Math.floor(duration / selectedImages.length));

// GitHub repository configuration
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'YOUR_USERNAME'; // Set in .env
const GITHUB_REPO = process.env.GITHUB_REPO || 'prowash-pics-video-creator';
const USE_GITHUB_IMAGES = process.env.USE_GITHUB_IMAGES === 'true';

// Sample images for testing - fallback if GitHub not configured
const sampleImages = [
  "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg",
  "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg",
  "https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg",
  "https://images.pexels.com/photos/1563354/pexels-photo-1563354.jpeg",
  "https://images.pexels.com/photos/1624504/pexels-photo-1624504.jpeg"
];

const sampleAudio = "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3";

let imageUrls, audioUrl;

if (USE_GITHUB_IMAGES && GITHUB_USERNAME !== 'YOUR_USERNAME') {
  // Use GitHub raw URLs for your actual images
  const baseUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main`;
  imageUrls = selectedImages.map(img => `${baseUrl}/images/${img}`);
  audioUrl = `${baseUrl}/audio/${selectedAudio}`;
  
  console.log('\n✅ Using your GitHub-hosted images!');
  console.log(`Repository: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}`);
} else {
  // Use sample images for testing
  imageUrls = sampleImages.slice(0, selectedImages.length);
  audioUrl = sampleAudio;
  
  console.log('\n⚠️  Using sample remote images for testing!');
  console.log('To use your own images:');
  console.log('1. Push this project to GitHub');
  console.log('2. Set GITHUB_USERNAME and USE_GITHUB_IMAGES=true in .env');
  console.log('3. Run the script again\n');
}
const json2videoInput = {
  resolution: "full-hd",
  quality: "high",
  scenes: imageUrls.map((imageUrl, index) => ({
    comment: `Scene ${index + 1}: ${USE_GITHUB_IMAGES ? selectedImages[index] : 'Sample image ' + (index + 1)}`,
    transition: index > 0 ? {
      style: "fade",
      duration: 0.5
    } : undefined,
    elements: [
      {
        type: "image",
        src: imageUrl,
        duration: imageDuration
      }
    ]
  })),
  elements: [
    {
      type: "audio",
      src: audioUrl
    }
  ]
};

console.log('Creating video with:', {
  images: selectedImages.length,
  audio: selectedAudio,
  duration: duration + 's',
  output: config.outputVideo
});

// Main async function
async function main() {
// Write input to a temp file
const tmpInputPath = './json2video_input.json';
fs.writeFileSync(tmpInputPath, JSON.stringify(json2videoInput, null, 2));

// Run the json2video-mcp command
try {
  console.log('Starting video creation...');
  console.log('API Key (first 10 chars):', process.env.JSON2VIDEO_API_KEY?.substring(0, 10) + '...');
  console.log('Sending JSON to json2video-mcp...');
  
  const result = execSync(`npx -y @omerrgocmen/json2video-mcp --input ${tmpInputPath}`, { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log('json2video-mcp output:', result);
  
  // Parse output for video URL or project ID
  let videoUrl = null;
  let projectId = null;
  
  // Look for URLs in the output
  const urlRegex = /https?:\/\/[^\s]+\.(mp4|mov|avi)/gi;
  const urlMatches = result.match(urlRegex);
  if (urlMatches && urlMatches.length > 0) {
    videoUrl = urlMatches[0];
    console.log('Found video URL:', videoUrl);
  }
  
  // Look for project ID
  const projectIdRegex = /(?:project[\s_-]*id|id)[:\s]*["']?([a-zA-Z0-9-]+)["']?/gi;
  const idMatches = result.match(projectIdRegex);
  if (idMatches && idMatches.length > 0) {
    projectId = idMatches[0].split(/[:\s"']+/).pop();
    console.log('Found project ID:', projectId);
  }
  
  if (videoUrl) {
    console.log('Video created successfully! URL:', videoUrl);
  } else if (projectId) {
    console.log('Video generation started with project ID:', projectId);
    console.log('Note: You may need to check the status later to get the final video URL.');
  } else {
    console.log('Video creation process initiated. Check json2video dashboard for results.');
  }

  // Move used images and video to 'done' folder
  const doneDir = path.resolve(config.doneDir);
  if (!fs.existsSync(doneDir)) {
    fs.mkdirSync(doneDir, { recursive: true });
    console.log('Created done directory:', doneDir);
  }
  
  // Move images
  console.log('Moving images to done folder...');
  selectedImages.forEach(img => {
    const src = path.resolve(config.imagesDir, img);
    const dest = path.join(doneDir, img);
    if (fs.existsSync(src)) {
      fs.renameSync(src, dest);
      console.log(`Moved: ${img}`);
    } else {
      console.warn(`Image not found: ${src}`);
    }
  });
  
  // Handle video URL or download if available
  if (videoUrl) {
    console.log('\n=== Video Generation Successful! ===');
    console.log('Video URL:', videoUrl);
    
    // Save video info to a results file
    const videoInfo = {
      timestamp: new Date().toISOString(),
      images: selectedImages,
      audio: selectedAudio,
      duration: duration,
      videoUrl: videoUrl,
      projectId: projectId
    };
    
    const resultsFile = path.join(doneDir, `video_result_${Date.now()}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(videoInfo, null, 2));
    console.log('Video info saved to:', resultsFile);
    
    // Optionally download the video
    if (config.downloadVideo) {
      console.log('Downloading video...');
      const videoFileName = `video_${Date.now()}.mp4`;
      const videoPath = path.join(doneDir, videoFileName);
      try {
        await downloadVideo(videoUrl, videoPath);
        console.log('Video downloaded successfully:', videoPath);
        videoInfo.localPath = videoPath;
        fs.writeFileSync(resultsFile, JSON.stringify(videoInfo, null, 2));
      } catch (err) {
        console.error('Failed to download video:', err.message);
        console.log('Video is still available at URL:', videoUrl);
      }
    } else {
      console.log('To download the video manually, run:');
      console.log(`curl -o "${path.join(doneDir, 'video_' + Date.now() + '.mp4')}" "${videoUrl}"`);
    }
  } else {
    console.log('\n=== Video Generation Initiated ===');
    if (projectId) {
      console.log('Project ID:', projectId);
      console.log('Check the video status later using the project ID.');
    }
    console.log('Video will be available via URL once processing is complete.');
    console.log('Check your json2video.com dashboard for the final video.');
  }
  
  // Keep temp file for debugging (comment out cleanup)
  // if (fs.existsSync(tmpInputPath)) {
  //   fs.unlinkSync(tmpInputPath);
  //   console.log('Cleaned up temp file:', tmpInputPath);
  // }
  console.log('Input file preserved for debugging:', tmpInputPath);
} catch (err) {
  console.error('Error running json2video-mcp:', err.message);
  if (err.stdout) console.log('stdout:', err.stdout);
  if (err.stderr) console.error('stderr:', err.stderr);
  
  console.log('\nThis could be due to:');
  console.log('- Invalid or missing JSON2VIDEO_API_KEY');
  console.log('- Network connectivity issues');
  console.log('- API service limitations');
  console.log('- Incorrect input format');
  
  // Keep temp file for debugging on error too
  // if (fs.existsSync(tmpInputPath)) {
  //   fs.unlinkSync(tmpInputPath);
  // }
  console.log('Input file preserved for debugging:', tmpInputPath);
  process.exit(1);
}
}

// Run the main function
main().catch(console.error); 