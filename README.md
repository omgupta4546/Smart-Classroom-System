# 🎓 Smart Classroom System (AI Attendance)

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

A Scalable, AI-Powered Student Attendance System built with the **MERN Stack**. It uses **Client-Side Computer Vision** (`face-api.js`) to mark attendance via live camera or group photo upload.

## 🌟 Features

### 🤖 AI-Powered Attendance
-   **Live Recognition**: Real-time face detection runs entirely in the browser (Privacy-first).
-   **Anti-Spoofing**: High-accuracy **SSD MobileNet V1** models.
-   **Offline Mode**: Internet down? Profs can **Upload a Class Photo** later, and the AI will find students in the static image!

### ⚡ Smart Dashboard
-   **Glassmorphism UI**: Modern, responsive design for all devices.
-   **Role-Based Access**:
    -   **Students**: Register Face ID, View Attendance History, Join Classes.
    -   **Professors**: Create Classes, Take Attendance (Live/Manual), Manage Students.
-   **Manual Override**: Sidebar to manually mark students present or absent if searching fails.

## 🛠️ Tech Stack

-   **Frontend**: React (Vite), Context API, CSS Modules.
-   **Backend**: Node.js, Express.js.
-   **Database**: MongoDB Atlas.
-   **AI Engine**: `face-api.js` (TensorFlow.js wrapper).
-   **Deployment**: Vercel (Client) + Render (Server).

## 🚀 Live Demo

-   **Frontend**: [https://smart-classroom-system2.vercel.app](https://smart-classroom-system2.vercel.app)
-   **Backend API**: [https://attendance-backend-0gny.onrender.com](https://attendance-backend-0gny.onrender.com)

## 📦 Installation (Local)

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/Pankajsharma99max/Smart-Classroom-System.git
    cd Smart-Classroom-System
    ```

2.  **Setup Backend**:
    ```bash
    cd server
    npm install
    # Create .env file with:
    # MONGO_URI=your_mongodb_connection_string
    # JWT_SECRET=your_secret
    node index.js
    ```

3.  **Setup Frontend**:
    ```bash
    cd ../client
    npm install
    npm run dev
    ```

4.  **Open Browser**:
    Go to `http://localhost:5173`

## 🤝 Contributing
Pull requests are welcome! Please open an issue first to discuss what you'd like to change.

## 📄 License
[MIT](https://choosealicense.com/licenses/mit/)
