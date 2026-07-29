import requests
import base64
import logging
from typing import Dict, Any

# Configure standard logging for the module
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VLMProcessor:
    """
    Handles interactions with the local Vision-Language Model (LLaVA) via Ollama.
    """
    
    def __init__(self, model_name: str = "llava", host: str = "http://localhost:11434"):
        self.model_name = model_name
        self.api_url = f"{host}/api/generate"

    def analyze_image(self, image_path: str, prompt: str) -> Dict[str, Any]:
        """
        Encodes the target image and transmits it to the LLaVA model along with 
        the specified prompt for extraction and analysis.
        """
        logger.info(f"Initializing VLM extraction using model: '{self.model_name}'")
        
        try:
            # Read and encode the image to Base64 format required by Ollama API
            with open(image_path, "rb") as image_file:
                encoded_image = base64.b64encode(image_file.read()).decode('utf-8')

            # Construct the payload
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "images": [encoded_image],
                "stream": False
            }

            # Execute the API call
            response = requests.post(self.api_url, json=payload)
            response.raise_for_status()
            
            result = response.json()
            logger.info("Successfully retrieved inference response from LLaVA.")
            
            return {
                "status": "success", 
                "extracted_text": result.get("response", "")
            }

        except Exception as e:
            logger.error(f"Critical error during VLM processing: {str(e)}")
            return {
                "status": "error", 
                "message": str(e)
            }