# Prowash Pics Video Creator

Automated video creation from images and audio using the json2video API. Creates beautiful slideshows with fade transitions and background music.

## Features

- 🎬 **Automated Video Creation** - Randomly selects images and audio to create unique videos
- 🖼️ **Image Slideshow** - Creates smooth transitions between multiple images  
- 🎵 **Background Audio** - Adds soundtrack to your videos
- ⚙️ **Configurable Settings** - Customize duration, number of images, and more
- 🌐 **Cloud-Based** - Uses json2video.com for professional video rendering
- 📁 **Auto Organization** - Moves completed files to organized folders

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get API Key
1. Sign up at [json2video.com](https://json2video.com)
2. Get your free API key

### 3. Configure Environment
Create a `.env` file with your settings:
```bash
cp .env.example .env
```

Edit `.env` and add your API key:
```
JSON2VIDEO_API_KEY=your_api_key_here

# Video Configuration
NUM_IMAGES=5
MIN_DURATION=5
MAX_DURATION=10
DOWNLOAD_VIDEO=false
```

### 4. Add Your Content
- Place your images in the `./images` directory (JPG/PNG format)
- Add audio files to the `./audio` directory (MP3 format)

## Usage

### Create a Video
```bash
npm start
```

The script will:
1. Randomly select images and audio
2. Create a slideshow with fade transitions
3. Submit to json2video.com for rendering
4. Move processed files to the `done/` folder
5. Save video information and URLs

### Check Results
- Videos are rendered on json2video.com cloud
- Check your [json2video dashboard](https://json2video.com/dashboard) for results
- Video URLs and metadata are saved in `done/video_result_*.json` files

## Configuration Options

Edit `.env` to customize:

| Setting | Description | Default |
|---------|-------------|---------|
| `NUM_IMAGES` | Number of images per video | 5 |
| `MIN_DURATION` | Minimum video length (seconds) | 5 |
| `MAX_DURATION` | Maximum video length (seconds) | 10 |
| `IMAGES_DIR` | Source images directory | `./images` |
| `AUDIO_DIR` | Audio files directory | `./audio` |
| `DONE_DIR` | Completed files directory | `./done` |
| `DOWNLOAD_VIDEO` | Auto-download videos | `false` |

## Project Structure

```
prowash-pics-video-creator/
├── README.md                 # This file
├── package.json             # Node.js project config
├── create_video_from_images.js # Main script
├── .env                     # Your API keys & settings
├── .env.example             # Example environment file
├── .gitignore              # Git ignore file
├── images/                 # Source images directory
├── audio/                  # Audio files directory
└── done/                   # Completed videos & metadata
```

## How It Works

1. **Image Selection** - Randomly picks images from your collection
2. **Audio Selection** - Randomly selects background music 
3. **JSON Generation** - Creates proper json2video API format
4. **Cloud Rendering** - Submits to json2video.com for processing
5. **Result Tracking** - Saves video URLs and metadata
6. **File Management** - Organizes completed files

## Video Output

Videos are created with:
- **Resolution**: Full HD (1920x1080)
- **Quality**: High
- **Transitions**: Smooth fades between images
- **Audio**: Background music throughout
- **Format**: MP4

## Troubleshooting

### No images found
- Make sure you have JPG/PNG files in the `./images` directory
- Check that `IMAGES_DIR` setting points to correct location

### No audio found  
- Add MP3 files to the `./audio` directory
- Check that `AUDIO_DIR` setting is correct

### API errors
- Verify your `JSON2VIDEO_API_KEY` is correct
- Check your json2video.com account status
- Ensure you have API credits available

### Video not created
- Check your [json2video dashboard](https://json2video.com/dashboard)
- Look for error messages in the console output
- Verify all image URLs are accessible

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ using [json2video.com](https://json2video.com) API