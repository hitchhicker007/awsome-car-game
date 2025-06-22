# 🏎️ Awesome Car Game

This is a real-time multiplayer 3D car game built with **Three.js**, **Socket.IO**, and **Node.js**.  
The frontend is deployed using **Firebase Hosting**, and the backend Socket.IO server runs on an **Ubuntu EC2 instance**, served securely through **Nginx with HTTPS**.

---

## 📁 Project Structure

```
.
├── server/                    # Node.js backend
│   ├── server.js              # Main Socket.IO server
│   ├── package.json
│   └── package-lock.json
│
├── web/                       # Frontend (Firebase Hosting)
│   ├── assets/                # 3D models, textures, sounds
│   ├── libs/
│   ├── styles/
│   ├── index.html             # Game page
│   ├── main.js                # Game logic & socket connection
│   ├── style.css              # Game styles
│   ├── firebase.json          # Firebase Hosting config
│   ├── .firebaserc
│   ├── 404.html
│   └── .gitignore
```

---

## 🚀 Features

- Real-time multiplayer car movement using WebSockets
- 3D gameplay using Three.js and GLTF models
- Firebase Hosting for fast and global frontend delivery
- Secure WebSocket connection via Nginx + Let's Encrypt SSL
- Works across desktop and mobile browsers

---

## 🌐 Live Preview

> Check this link for live preview:
> - [https://awsome-car-game.web.app/](https://awsome-car-game.web.app/)

---



## 📦 Tech Stack

- **Node.js** + **Express** + **Socket.IO**
- **Three.js** for 3D rendering
- **Firebase Hosting** for frontend
- **AWS EC2** for backend
- **Nginx + Certbot** for reverse proxy and HTTPS
- **PM2** for process management

---

## 📜 License

MIT License – Free to use, modify, and distribute.

---

## ✨ Credits

Created by Parth Panchal

3D models, textures, and sounds used are either self-created or sourced from open-license libraries.