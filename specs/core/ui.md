# Spec: ENSIA Export AI Command Center (UI)

## 🎯 Goal
Create a premium, professional web interface for the Export AI Engine that allows compliance officers to interact with the Agent, visualize RAG sources, and upload documents for vision analysis.

## 🎨 Design System
- **Theme**: Sleek Dark Mode (NVIDIA Green & Deep Charcoal).
- **Aesthetics**: Glassmorphism, smooth transitions, and glowing interactive elements.
- **Typography**: Inter / Roboto (via Google Fonts).

## 🛠️ Features
1.  **Chat Interface**: Real-time interaction with the ReAct Agent.
2.  **Multimodal Upload**: Drag-and-drop zone for PDF/Image compliance reviews.
3.  **Process Visualization**: A side panel showing the "Agent Thoughts" and which tools are being triggered (RAG vs Browser vs Vision).
4.  **Source Attribution**: Deep links to retrieved document chunks.

## 🔧 Components
- `streamlit`: Main UI framework.
- `streamlit-chat`: For a modern messaging experience.
- `core.agent`: To invoke the initialized orchestrator.

## 🚀 Usage
```powershell
streamlit run app.py
```
