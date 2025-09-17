# Gemini 2.5 Flash Image Documentation

## Overview

**Model:** `gemini-2.5-flash-preview-image` (also known as nano-banana)  
**Release Date:** August 2025  
**Status:** Preview (will be stable soon)

Gemini 2.5 Flash Image is Google's state-of-the-art multimodal model with native image generation and editing capabilities. It combines text understanding with image creation, editing, and fusion capabilities while maintaining Gemini's world knowledge.

## Key Capabilities

### 1. Image Generation (Text-to-Image)
- Generate high-quality images from text prompts
- Photorealistic and artistic styles
- World knowledge integration for accurate representations
- SynthID watermarking on all generated images

### 2. Image Editing (Text-and-Image-to-Image)
- Natural language-based image transformations
- Targeted local edits
- Background blur/removal
- Object removal/addition
- Color correction and stylization
- Pose alterations

### 3. Character & Style Consistency
- Maintain character appearance across multiple generations
- Consistent brand assets creation
- Visual template adherence
- Product showcase from multiple angles

### 4. Multi-Image Fusion
- Blend multiple input images into one
- Object insertion into scenes
- Style transfer between images
- Scene composition

### 5. Conversational Image Generation
- Multi-turn image editing
- Context-aware modifications
- Interleaved text and image outputs

## Technical Specifications

### Model Details
- **Architecture:** Sparse Mixture-of-Experts (MoE) transformer with native multimodal support
- **Context Window:** 1M tokens input
- **Output Limits:** 
  - Text: 64K tokens
  - Images: 32K tokens (each image = 1290 tokens)
- **Supported Input:** Text, images, audio, video
- **Supported Output:** Text and images (must include both modalities)

### Pricing
- **Image Generation:** $30.00 per 1M output tokens
- **Per Image Cost:** ~$0.039 (1290 tokens per image)
- **Other Modalities:** Follow standard Gemini 2.5 Flash pricing

### Performance Benchmarks
- **Overall Preference (LMArena):** 1147 (ranked #1)
- **Visual Quality:** 1103
- **Text-to-Image Alignment:** 1042
- **Image Editing Overall:** 1362 (ranked #1)

## API Implementation

### Python Example

```python
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

client = genai.Client()

# Image Generation (Text-to-Image)
def generate_image(prompt):
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-image-generation",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=['TEXT', 'IMAGE']
        )
    )
    
    for part in response.candidates[0].content.parts:
        if part.text is not None:
            print(part.text)
        elif part.inline_data is not None:
            image = Image.open(BytesIO(part.inline_data.data))
            image.save('generated_image.png')
            return image

# Image Editing (Text-and-Image-to-Image)
def edit_image(prompt, image_path):
    image = Image.open(image_path)
    
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-image-generation",
        contents=[prompt, image],
        config=types.GenerateContentConfig(
            response_modalities=['TEXT', 'IMAGE']
        )
    )
    
    for part in response.candidates[0].content.parts:
        if part.text is not None:
            print(part.text)
        elif part.inline_data is not None:
            edited_image = Image.open(BytesIO(part.inline_data.data))
            edited_image.save('edited_image.png')
            return edited_image

# Multi-Image Fusion
def fuse_images(prompt, image_paths):
    images = [Image.open(path) for path in image_paths]
    contents = [prompt] + images
    
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-image-generation",
        contents=contents,
        config=types.GenerateContentConfig(
            response_modalities=['TEXT', 'IMAGE']
        )
    )
    
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            fused_image = Image.open(BytesIO(part.inline_data.data))
            return fused_image
```

### JavaScript Example

```javascript
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";

async function generateImage(prompt) {
    const ai = new GoogleGenAI({});
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-image-generation",
        contents: prompt,
        config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
    });
    
    for (const part of response.candidates[0].content.parts) {
        if (part.text) {
            console.log(part.text);
        } else if (part.inlineData) {
            const imageData = part.inlineData.data;
            const buffer = Buffer.from(imageData, "base64");
            fs.writeFileSync("generated_image.png", buffer);
            console.log("Image saved");
        }
    }
}

async function editImage(prompt, imagePath) {
    const ai = new GoogleGenAI({});
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString("base64");
    
    const contents = [
        { text: prompt },
        {
            inlineData: {
                mimeType: "image/png",
                data: base64Image,
            },
        },
    ];
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-image-generation",
        contents: contents,
        config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
    });
    
    // Process response...
}
```

### REST API Example

```bash
# Image Generation
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-image-generation:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [
        {"text": "Generate a futuristic city with flying cars"}
      ]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"]
    }
  }'

# Image Editing with Base64 Image
IMG_BASE64=$(base64 -w0 "/path/to/image.jpg")
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-image-generation:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"contents\": [{
      \"parts\": [
        {\"text\": \"Remove the background and make it white\"},
        {
          \"inline_data\": {
            \"mime_type\": \"image/jpeg\",
            \"data\": \"$IMG_BASE64\"
          }
        }
      ]
    }],
    \"generationConfig\": {
      \"responseModalities\": [\"TEXT\", \"IMAGE\"]
    }
  }"
```

## Important Configuration Notes

### Required Configuration
- **MUST include both modalities:** `responseModalities: ["TEXT", "IMAGE"]`
- Image-only output is NOT supported
- The model will output both text description and image

### Image Input Formats
- **Base64 encoded images** for inline data
- **Direct PIL Image objects** (Python)
- **Buffer data** (Node.js)
- Supported formats: PNG, JPEG, GIF, WebP

### Response Handling
- Responses contain multiple parts (text and image)
- Always check part type before processing
- Images are returned as base64 encoded data in `inline_data`

## Prompt Engineering Best Practices

### For Image Generation
1. **Be Descriptive:** Include subject, context/background, and style
2. **Specify Quality:** Add modifiers like "high-quality", "photorealistic", "4K"
3. **Define Style:** Mention artistic style (e.g., "oil painting", "3D render", "anime")
4. **Set Aspect Ratio:** Can specify ratios like 1:1, 4:3, 16:9, 9:16, 3:4
5. **Use World Knowledge:** Leverage Gemini's understanding of real-world concepts

### For Image Editing
1. **Be Specific:** Clearly describe what to change
2. **Use Natural Language:** "Remove the person on the left", "Blur the background"
3. **Reference Elements:** Point to specific objects or areas
4. **Maintain Context:** Build on previous edits in multi-turn conversations

### For Character Consistency
1. **Initial Description:** Provide detailed character description first
2. **Reference Previous:** "Use the same character from before"
3. **Maintain Details:** Keep consistent clothing, features, style

### For Multi-Image Fusion
1. **Clear Instructions:** Specify how to combine images
2. **Object Placement:** "Put the cat from image 1 into the scene from image 2"
3. **Style Transfer:** "Apply the color scheme from image 1 to image 2"

## Use Case Examples

### Product Photography
```python
# Generate product in multiple settings
prompts = [
    "Show this product on a white studio background",
    "Place this product in a modern kitchen setting",
    "Display this product outdoors in natural lighting"
]
```

### Creative Storytelling
```python
# Maintain character across scenes
character = "A friendly robot with blue lights and silver body"
scenes = [
    f"{character} walking through a futuristic city",
    f"{character} sitting in a cafe reading a book",
    f"{character} flying through space"
]
```

### Photo Editing Workflows
```python
# Progressive edits
edits = [
    "Remove the background",
    "Add a sunset sky background",
    "Increase the saturation and contrast",
    "Add lens flare effect"
]
```

### Brand Asset Creation
```python
# Consistent brand materials
template = "minimalist logo for tech company, geometric shapes"
variations = [
    f"{template}, blue color scheme",
    f"{template}, monochrome version",
    f"{template}, with company name 'TechCo'"
]
```

## Limitations

### Current Limitations
1. **Long-form text rendering:** May struggle with lengthy text in images
2. **Fine detail accuracy:** Small details might not be perfectly represented
3. **Language support:** Best performance in English
4. **Audio/Video:** Not supported for image generation tasks
5. **Image-only output:** Must include text in response modalities

### Regional Availability
- Some regions/countries may have restricted access
- Check current availability in your region

### Safety & Ethics
- All images include invisible SynthID watermark
- Content safety filters applied
- Follows Google's AI Principles
- May refuse harmful or inappropriate requests

## Error Handling

### Common Issues & Solutions

1. **Missing Response Modalities**
   ```python
   # Wrong
   config=types.GenerateContentConfig()
   
   # Correct
   config=types.GenerateContentConfig(
       response_modalities=['TEXT', 'IMAGE']
   )
   ```

2. **Image Not Generated**
   - Try being more explicit: "generate an image of..."
   - Ensure prompt is clear about wanting visual output
   - Check if content was filtered for safety

3. **Base64 Decoding Issues**
   ```python
   try:
       image_data = base64.b64decode(part.inline_data.data)
       image = Image.open(BytesIO(image_data))
   except Exception as e:
       print(f"Error decoding image: {e}")
   ```

4. **Rate Limiting**
   - Implement exponential backoff
   - Monitor token usage
   - Consider batch processing for multiple images

## Migration from Gemini 2.0 Flash Image

### Key Improvements
- Higher image quality and resolution
- Better character consistency
- More powerful editing capabilities
- Improved prompt adherence
- Enhanced world knowledge integration

### API Changes
- Model name: `gemini-2.0-flash-image` → `gemini-2.5-flash-preview-image-generation`
- Same configuration requirements
- Improved performance metrics

## Additional Resources

- **Official Documentation:** https://ai.google.dev/gemini-api/docs/image-generation
- **Google AI Studio:** https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-preview-image
- **Vertex AI Console:** https://console.cloud.google.com/vertex-ai/studio/multimodal
- **Developer Forum:** https://discuss.ai.google.dev/c/gemini-api/4
- **Model Card:** https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-2-5-Flash-Model-Card.pdf

## Quick Reference

| Feature | Support | Notes |
|---------|---------|-------|
| Text-to-Image | ✅ | High quality generation |
| Image Editing | ✅ | Natural language edits |
| Multi-Image Input | ✅ | Fusion and composition |
| Character Consistency | ✅ | Maintain across prompts |
| Batch Generation | ✅ | Up to 4 images per call |
| Aspect Ratios | ✅ | 1:1, 4:3, 3:4, 16:9, 9:16 |
| SynthID Watermark | ✅ | Automatic on all outputs |
| Image-Only Output | ❌ | Must include TEXT modality |
| Video Generation | ❌ | Not supported |
| Audio Input/Output | ❌ | Not for image tasks |

## Version History

- **August 2025:** Initial preview release as `gemini-2.5-flash-preview-image`
- **Coming Soon:** Stable release with improved text rendering and consistency