import { useState } from "react";
import "./App.css";

function App() {
  const [customMessage, setCustomMessage] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const quickMessages = [
    "I need some time to process this.",
    "Please speak more slowly.",
    "I need a break.",
    "I don't understand. Could you explain that again?",
    "Please give me a moment.",
    "I need help."
  ];

  function speakMessage(message) {
    if (!message.trim()) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(message);
    speech.rate = 0.9;

    speech.onstart = () => setSpeaking(true);
    speech.onend = () => setSpeaking(false);

    window.speechSynthesis.speak(speech);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return (
    <div className="app">
      <div className="container">

        <h1>NeuroSafe</h1>
        <h2>Say It for Me</h2>

        <p className="description">
          Choose a message below and NeuroSafe will speak it for you.
        </p>

        <h2 className="section-title">Quick Messages</h2>

        <div className="messages">
          {quickMessages.map((message) => (
            <button
              className="message-button"
              key={message}
              onClick={() => speakMessage(message)}
            >
              {message}
            </button>
          ))}
        </div>

        <h2 className="section-title">Say Something Else</h2>

        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Type what you want to say..."
        />

        <button
          className="speak-button"
          onClick={() => speakMessage(customMessage)}
          disabled={!customMessage.trim()}
        >
          🔊 Speak My Message
        </button>

        {speaking && (
          <button
            className="stop-button"
            onClick={stopSpeaking}
          >
            ■ Stop Speaking
          </button>
        )}

      </div>
    </div>
  );
}

export default App;
