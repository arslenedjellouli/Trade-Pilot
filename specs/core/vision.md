# Spec: NVIDIA-Powered Vision Tool

## 🎯 Goal
Enable the Agent to analyze visual assets such as export diagrams, scanned licenses, or shipping documents using NVIDIA's vision-language models.

## 🛠️ Logic
1.  **Input**: Receive a path to an image file or a base64 encoded image.
2.  **Processing**: 
    -   Use `ChatNVIDIA` with a vision-capable model (e.g., `nvidia/llama-3.2-11b-vision-instruct`).
    -   Send the image and a descriptive prompt to the model.
3.  **OCR/Analysis**: The model extracts text from the image or explains complex compliance diagrams.
4.  **Integration**: Return the visual analysis to the Orchestrator as text context.

## 🔧 Components
- `from langchain_nvidia_ai_endpoints import ChatNVIDIA`
- `from langchain_core.messages import HumanMessage`

## 📊 Models
- **Default**: `nvidia/llama-3.2-11b-vision-instruct` (or latest available NIM vision model).

## 🚀 Usage
The agent will call this tool when it detects an image file path in the query or if the user uploads an asset for compliance review.
