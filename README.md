# Video Encryption Web Application 🛡️

This project is a web application that allows users to encrypt and decrypt video files directly in their browser. It utilizes modern cryptographic algorithms like AES-256-CBC and ChaCha20 to ensure the confidentiality of video data. The application provides a user-friendly interface for file upload, encryption/decryption algorithm selection, and password input.

## 🚀 Key Features

- **File Upload:** Allows users to upload video files securely through a web form. 📤
- **Encryption:** Encrypts video files using AES-256-CBC or ChaCha20 algorithms. 🔒
- **Decryption:** Decrypts previously encrypted video files using the correct password and algorithm. 🔓
- **Key Derivation:** Derives a strong encryption key from the user-provided password using SHA-256 hashing. 🔑
- **Initialization Vector (IV):** Generates a random IV for each encryption operation, enhancing security. 🎲
- **Algorithm Selection:** Provides options to choose between AES-256-CBC and ChaCha20 encryption algorithms. ⚙️
- **User Interface:** Offers a simple and intuitive web interface for easy interaction. 🌐
- **Error Handling:** Implements robust error handling to provide informative messages to the user. ⚠️

## 🛠️ Tech Stack

| Category    | Technology       | Description                                                                 |
|-------------|------------------|-----------------------------------------------------------------------------|
| Frontend      | HTML/CSS/JS      | Provides the user interface for file upload and interaction.                |
| Backend       | Node.js          | Runtime environment for the server-side application.                         |
| Framework     | Express.js       | Web application framework for routing and middleware.                         |
| Template Engine | EJS              | Template engine for rendering dynamic HTML views.                            |
| File Upload   | Multer           | Middleware for handling file uploads.                                       |
| Cryptography  | Crypto (Node.js) | Built-in module for cryptographic functions (hashing, encryption, decryption). |
| Other       | Path (Node.js)   | Built-in module for working with file paths.                               |
|             | FS (Node.js)     | Built-in module for file system operations.                                |
| Dev Tool      | Nodemon          | Automatically restarts the server upon file changes during development.      |

## 📦 Getting Started

These instructions will guide you on how to set up and run the video encryption web application locally.

### Prerequisites

- Node.js (version >= 14) installed on your machine.
- npm (Node Package Manager) or yarn.

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    cd video-encryption-app
    ```

2.  Install the dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

### Running Locally

1.  Start the development server:

    ```bash
    npm run dev
    # or
    yarn dev
    ```

    This will start the server using `nodemon`, which automatically restarts the server when you make changes to the code.

2.  Open your web browser and navigate to `http://localhost:3000` (or the port specified in your `server.js` file).

## 💻 Project Structure

```
video-encryption-app/
├── uploads/                # Directory to store uploaded and encrypted files
├── server.js               # Main application file
├── package.json            # Project metadata and dependencies
├── package-lock.json       # Records the exact versions of dependencies
├── views/                  # Directory containing EJS templates
│   └── index.ejs           # Main HTML template
└── node_modules/           # Directory containing installed npm packages (not in repo)
```

## 📸 Screenshots

(Screenshots will be added here)

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with descriptive commit messages.
4.  Push your changes to your fork.
5.  Submit a pull request to the main repository.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

If you have any questions or suggestions, feel free to contact me at [your_email@example.com](mailto:your_email@example.com).

## 💖 Thanks

Thank you for checking out this project! I hope you find it useful.

This README is written by [readme.ai](https://readme-generator-phi.vercel.app/), your go-to platform for generating beautiful and informative README files.
