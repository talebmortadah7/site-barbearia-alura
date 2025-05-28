// Importa as funções necessárias do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Variáveis globais do ambiente (fornecidas pelo Canvas)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let db;
let auth;
let userId = null; // Para armazenar o UID do usuário autenticado

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
db = getFirestore(app);
auth = getAuth(app);

// Autentica o usuário (anonimamente ou com token personalizado)
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
                console.log("Autenticado com token personalizado.");
            } else {
                await signInAnonymously(auth);
                console.log("Autenticado anonimamente.");
            }
        } catch (error) {
            console.error("Erro na autenticação:", error);
            // Em um ambiente real, você mostraria uma mensagem de erro ao usuário
        }
    }
    userId = auth.currentUser?.uid || crypto.randomUUID(); // Garante um userId
    console.log("UserID atual:", userId);
});


// Adiciona um listener para o evento de submit do formulário
document.getElementById('registrationForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    // Verifica se o Firebase e a autenticação estão prontos
    if (!db || !auth.currentUser) {
        console.error("Firebase não inicializado ou usuário não autenticado.");
        // Em um ambiente real, você mostraria uma mensagem de erro ao usuário
        return;
    }

    const form = event.target;
    const formData = new FormData(form);
    const data = {};

    // Coleta os dados do formulário
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Adiciona o userId aos dados (importante para as regras de segurança do Firestore)
    data.userId = userId;
    data.timestamp = new Date(); // Adiciona um timestamp para ordenação, se necessário

    try {
        // Caminho da coleção para dados públicos (conforme as instruções)
        const collectionPath = `artifacts/${appId}/public/data/inscricoes`;
        await addDoc(collection(db, collectionPath), data);

        console.log("Inscrição enviada com sucesso para o Firestore:", data);

        // Exibe a mensagem de confirmação
        const confirmationMessage = document.getElementById('confirmationMessage');
        confirmationMessage.classList.remove('hidden');

        // Limpa o formulário após o envio
        form.reset();

        // Esconde a mensagem após alguns segundos
        setTimeout(() => {
            confirmationMessage.classList.add('hidden');
        }, 5000);

    } catch (e) {
        console.error("Erro ao adicionar documento ao Firestore:", e);
        // Em um ambiente real, você mostraria uma mensagem de erro ao usuário
        // Ex: alert("Erro ao enviar inscrição. Tente novamente.");
        const confirmationMessage = document.getElementById('confirmationMessage');
        confirmationMessage.classList.remove('bg-green-100', 'border-green-400', 'text-green-700');
        confirmationMessage.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
        confirmationMessage.innerHTML = '<p class="font-bold">Erro ao enviar inscrição!</p><p>Por favor, tente novamente.</p>';
        confirmationMessage.classList.remove('hidden');
        setTimeout(() => {
            confirmationMessage.classList.add('hidden');
            confirmationMessage.classList.remove('bg-red-100', 'border-red-400', 'text-red-700');
            confirmationMessage.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
        }, 5000);
    }
});
