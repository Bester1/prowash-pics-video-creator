const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// Configuration
const config = {
  imagesDir: process.env.IMAGES_DIR || './images',
  audioDir: process.env.AUDIO_DIR || './audio',
  doneDir: process.env.DONE_DIR || './done',
  numImages: parseInt(process.env.NUM_IMAGES) || 5,
  templateId: process.env.TEMPLATE_ID || 'hrLQ0glFuCjrDV4X6c5K',
  downloadVideo: process.env.DOWNLOAD_VIDEO === 'true'
};

// GitHub repository configuration
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'Bester1';
const GITHUB_REPO = process.env.GITHUB_REPO || 'prowash-pics-video-creator';
const USE_GITHUB_IMAGES = process.env.USE_GITHUB_IMAGES === 'true';

// Helper to get random elements from an array
function getRandomElements(arr, n) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// Helper to make API call to json2video
function callJson2VideoAPI(payload) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: 'api.json2video.com',
      port: 443,
      path: '/v2/movies',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.JSON2VIDEO_API_KEY,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (err) {
          reject(new Error('Invalid JSON response: ' + responseData));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

// Helper to check video status
function checkVideoStatus(projectId) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    
    const options = {
      hostname: 'api.json2video.com',
      port: 443,
      path: `/v2/movies?project=${projectId}`,
      method: 'GET',
      headers: {
        'x-api-key': process.env.JSON2VIDEO_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (err) {
          reject(new Error('Invalid JSON response: ' + responseData));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// Main async function
async function main() {
  console.log('🎬 Creating Professional Prowash Video...\n');

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

  // Create image URLs
  let imageUrls, audioUrl;
  
  if (USE_GITHUB_IMAGES && GITHUB_USERNAME !== 'YOUR_USERNAME') {
    // Use GitHub raw URLs for your actual images
    const baseUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main`;
    imageUrls = selectedImages.map(img => `${baseUrl}/images/${img}`);
    audioUrl = `${baseUrl}/audio/${selectedAudio}`;
    
    console.log('✅ Using your GitHub-hosted images!');
    console.log(`Repository: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}`);
  } else {
    console.error('GitHub configuration required for professional template!');
    console.log('Please set GITHUB_USERNAME and USE_GITHUB_IMAGES=true in .env');
    process.exit(1);
  }

  // Prepare professional template with image variables
  const templatePayload = {
    comment: "Professional Prowash Video using template with image variables",
    template: config.templateId,
    variables: {
      // Standard image variable names
      image1: imageUrls[0],
      image2: imageUrls[1], 
      image3: imageUrls[2],
      image4: imageUrls[3] || imageUrls[0], // fallback if less than 5 images
      image5: imageUrls[4] || imageUrls[1]  // fallback if less than 5 images
    }
  };

  console.log('\n🎨 Using Professional Template:');
  console.log('Template ID:', config.templateId);
  console.log('Variables:', {
    images: selectedImages.length,
    audio: selectedAudio,
    title: templatePayload.variables.title
  });

  try {
    console.log('\n🚀 Creating professional video...');
    console.log('API Key (first 10 chars):', process.env.JSON2VIDEO_API_KEY?.substring(0, 10) + '...');
    
    const result = await callJson2VideoAPI(templatePayload);
    
    if (result.success) {
      console.log('✅ Video creation started successfully!');
      console.log('Project ID:', result.project);
      
      // Check status periodically
      console.log('\n⏳ Checking video status...');
      let attempts = 0;
      const maxAttempts = 20; // 2 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds
        attempts++;
        
        const status = await checkVideoStatus(result.project);
        
        if (status.success && status.movie) {
          console.log(`Status: ${status.movie.status} - ${status.movie.message || 'Processing...'}`);
          
          if (status.movie.status === 'done') {
            console.log('\n🎉 VIDEO COMPLETED!');
            console.log('🔗 Video URL:', status.movie.url);
            console.log('⏱️  Duration:', status.movie.duration, 'seconds');
            console.log('📁 File Size:', Math.round(status.movie.size / 1024 / 1024), 'MB');
            
            // Save video info
            const doneDir = path.resolve(config.doneDir);
            if (!fs.existsSync(doneDir)) {
              fs.mkdirSync(doneDir, { recursive: true });
            }
            
            const videoInfo = {
              timestamp: new Date().toISOString(),
              template: config.templateId,
              projectId: result.project,
              images: selectedImages,
              audio: selectedAudio,
              videoUrl: status.movie.url,
              duration: status.movie.duration,
              size: status.movie.size
            };
            
            const resultsFile = path.join(doneDir, `professional_video_${Date.now()}.json`);
            fs.writeFileSync(resultsFile, JSON.stringify(videoInfo, null, 2));
            console.log('📋 Video info saved to:', resultsFile);
            
            // Move used images
            console.log('\n📁 Moving used images to done folder...');
            selectedImages.forEach(img => {
              const src = path.resolve(config.imagesDir, img);
              const dest = path.join(doneDir, img);
              if (fs.existsSync(src)) {
                fs.renameSync(src, dest);
                console.log(`Moved: ${img}`);
              }
            });
            
            console.log('\n🎬 Professional video creation complete!');
            return;
          } else if (status.movie.status === 'error') {
            console.error('❌ Video creation failed:', status.movie.message);
            process.exit(1);
          }
        }
      }
      
      console.log('⏰ Video is still processing. Check your dashboard:', 'https://json2video.com/dashboard');
      
    } else {
      console.error('❌ Failed to create video:', result.message || 'Unknown error');
      process.exit(1);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\nThis could be due to:');
    console.log('- Invalid or missing JSON2VIDEO_API_KEY');
    console.log('- Network connectivity issues');
    console.log('- Template not found');
    console.log('- Invalid image URLs');
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);