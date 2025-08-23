import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// --- Supabase setup ---
const SUPABASE_URL = "https://fbfgeobxinsmphjvchsw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZmdlb2J4aW5zbXBoanZjaHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODQxMjAsImV4cCI6MjA3MTU2MDEyMH0.2aGUK51oZSuxw80YwsHmUdmUTfeMd48mzNtVP9TpV4Q";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const userId = "ashu"; // Replace with real auth later
const chatWindow = document.getElementById("chatWindow");

// --- Tab Switching ---
document.querySelectorAll(".tab-card").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// --- Settings Tab ---
document.getElementById("settingsBtn").onclick = () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById("settings").classList.add("active");
};

document.getElementById("saveKeys").onclick = () => {
  const openaiKey = document.getElementById("openaiKey").value;
  const geminiKey = document.getElementById("geminiKey").value;
  if(openaiKey) localStorage.setItem("openaiKey", openaiKey);
  if(geminiKey) localStorage.setItem("geminiKey", geminiKey);
  alert("API keys saved!");
};

// --- Chat Functionality ---
document.getElementById("sendChat").onclick = sendMessage;

// Voice input
const micBtn = document.getElementById("micBtn");
if(navigator.mediaDevices && window.SpeechRecognition){
  const recognition = new window.SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = e => {
    const message = e.results[0][0].transcript;
    document.getElementById("chatInput").value = message;
  };
  micBtn.onclick = () => recognition.start();
}

async function sendMessage(){
  const message = document.getElementById("chatInput").value;
  if(!message) return;
  chatWindow.innerHTML += `<p><b>You:</b> ${message}</p>`;
  document.getElementById("chatInput").value = "";

  // Save user message
  await supabase.from("chat_memory").insert([{ user_id:userId, role:"user", message }]);

  // Decide API
  const openaiKey = localStorage.getItem("openaiKey");
  const geminiKey = localStorage.getItem("geminiKey");

  if(openaiKey){
    const res = await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }]
      })
    });
    const data = await res.json();
    const reply = data.choices[0].message.content;
    await saveAndDisplayReply(reply);
  } 
  else if(geminiKey){
    const res = await fetch("https://gemini.api/endpoint", {
      method: "POST",
      headers: { "Authorization": `Bearer ${geminiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: message })
    });
    const data = await res.json();
    const reply = data.reply;
    await saveAndDisplayReply(reply);
  } 
  else {
    // Default: Puter.js
    puter.ai.chat(message, { model: 'claude-sonnet-4' }).then(async response => {
      const reply = response.message.content[0].text;
      await saveAndDisplayReply(reply);
    });
  }
}

async function saveAndDisplayReply(reply){
  await supabase.from("chat_memory").insert([{ user_id:userId, role:"assistant", message: reply }]);
  chatWindow.innerHTML += `<p><b>Jarvis:</b> ${reply}</p>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- Notes ---
document.getElementById("saveNote").onclick = async () => {
  const content = document.getElementById("noteInput").value;
  if(!content) return;
  await supabase.from("notes").insert([{ user_id: userId, content }]);
  document.getElementById("noteInput").value = "";
  loadNotes();
};

async function loadNotes(){
  const { data } = await supabase.from("notes").select("*").eq("user_id", userId);
  document.getElementById("noteList").innerHTML = data.map(n => `<li>${n.content}</li>`).join("");
}
loadNotes();

// --- Todos ---
document.getElementById("addTodo").onclick = async () => {
  const task = document.getElementById("todoInput").value;
  if(!task) return;
  await supabase.from("todos").insert([{ user_id:userId, task, is_done:false }]);
  document.getElementById("todoInput").value = "";
  loadTodos();
};

async function loadTodos(){
  const { data } = await supabase.from("todos").select("*").eq("user_id", userId);
  document.getElementById("todoList").innerHTML = data.map(t => `<li>${t.task}</li>`).join("");
}
loadTodos();

// --- Reminders ---
document.getElementById("setReminder").onclick = async () => {
  const reminder_text = document.getElementById("reminderText").value;
  const remind_at = document.getElementById("reminderTime").value;
  if(!reminder_text || !remind_at) return;
  await supabase.from("reminders").insert([{ user_id:userId, reminder_text, remind_at }]);
  document.getElementById("reminderText").value = "";
  document.getElementById("reminderTime").value = "";
  loadReminders();
};

async function loadReminders(){
  const { data } = await supabase.from("reminders").select("*").eq("user_id", userId);
  document.getElementById("reminderList").innerHTML = data.map(r => `<li>${r.reminder_text} - ${new Date(r.remind_at).toLocaleString()}</li>`).join("");
}
loadReminders();