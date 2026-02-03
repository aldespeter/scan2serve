// ===== IMPORT FIREBASE =====
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===== APP STATE =====
const state = {
  tableNumber: null,
  guests: null,
  tableDishes: {}, // { dishId: quantity }
  orderPlaced: false,
  orderStatus: "kitchen" 
};

// These steps must exactly match the status strings used in your kitchen.html
const ORDER_STEPS = ['preparing', 'ready'];

const menuData = [
  { id: 1, name: "Paneer Tikka Royale", desc: "Saffron-marinated cottage cheese cubes chargrilled in clay oven", price: 345, category: "starters", diet: "veg", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500" },
  { id: 2, name: "Crispy Okra Fries", desc: "Thinly sliced ladyfingers dusted with mango powder and spices", price: 290, category: "starters", diet: "veg", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500" },
  { id: 4, name: "Tandoori Gobi", desc: "Cauliflower florets marinated in spiced yogurt and roasted in the tandoor", price: 310, category: "starters", diet: "veg", image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500" },
  { id: 7, name: "Classic Butter Chicken", desc: "Tandoori chicken pulled and simmered in a velvety tomato-makhani gravy", price: 590, category: "main", diet: "nonveg", image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500" },
  { id: 8, name: "Dal Makhani Heritage", desc: "Black lentils slow-cooked for 24 hours with white butter and cream", price: 420, category: "main", diet: "veg", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" },
  { id: 9, name: "Malai Kofta", desc: "Potato and paneer balls deep fried and served in a creamy tomato-based gravy", price: 480, category: "main", diet: "veg", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500" },
  { id: 13, name: "Hyderabadi Lamb Biryani", desc: "Long-grain basmati rice cooked on 'dum' with tender lamb", price: 650, category: "main", diet: "nonveg", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500" },
  { id: 19, name: "Royal Mango Lassi", desc: "Fresh yogurt drink with pureed Alphonso mangoes", price: 180, category: "drinks", diet: "veg", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEG39zmPnHmUT_NM_U50snJr5PCSvj0NTlbw&s"},
  { id: 22, name: "Gulab Jamun with Rabri", desc: "Deep fried milk solids in syrup served with thickened milk", price: 260, category: "desserts", diet: "veg", image: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=500" }
];

// ===== DOM ELEMENTS =====
const setupScreen = document.getElementById('setupScreen');
const mainApp = document.getElementById('mainApp');
const tableSelect = document.getElementById('tableSelect');
const guestSelect = document.getElementById('guestSelect');
const continueBtn = document.getElementById('continueBtn');
const displayTable = document.getElementById('displayTable');
const displayGuests = document.getElementById('displayGuests');
const diningTable = document.getElementById('diningTable');
const chairsContainer = document.getElementById('chairsContainer');
const tableDishesContainer = document.getElementById('tableDishes');
const menuGrid = document.getElementById('menuGrid');
const floatingSummary = document.getElementById('floatingSummary');
const totalItems = document.getElementById('totalItems');
const totalPrice = document.getElementById('totalPrice');
const panelOverlay = document.getElementById('panelOverlay');
const orderPanel = document.getElementById('orderPanel');
const btnViewTable = document.getElementById('btnViewTable');
const btnClosePanel = document.getElementById('btnClosePanel');
const orderReviewView = document.getElementById('orderReviewView');
const orderStatusView = document.getElementById('orderStatusView');
const orderItemsList = document.getElementById('orderItemsList');
const statusItemsList = document.getElementById('statusItemsList');
const panelEmpty = document.getElementById('panelEmpty');
const orderSummary = document.getElementById('orderSummary');
const panelTableNum = document.getElementById('panelTableNum');
const panelGuestNum = document.getElementById('panelGuestNum');

let currentOrderId = null;

// ===== REAL-TIME KITCHEN LISTENER =====
function listenToOrderUpdates(orderId) {
  const orderRef = doc(db, "orders", orderId);
  onSnapshot(orderRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.status) {
        state.orderStatus = data.status;
        updateStepperUI(data.status);
      }
    }
  });
}

function updateStepperUI(status) {
  const steps = document.querySelectorAll('.stepper-step');
  
  steps.forEach((step, index) => {
    step.classList.remove('active', 'completed');

    if (status === 'preparing') {
      if (index === 0) step.classList.add('completed');
      if (index === 1) step.classList.add('active');
    } 
    else if (status === 'ready') {
      step.classList.add('completed');
    }
  });
}

// ===== PLACE ORDER LOGIC =====
const btnPlaceOrder = document.getElementById('btnPlaceOrder');
btnPlaceOrder.onclick = async () => {
  if (state.orderPlaced || Object.keys(state.tableDishes).length === 0) return;

  btnPlaceOrder.disabled = true;
  btnPlaceOrder.innerText = "Sending to Kitchen...";

  try {
    const docRef = await addDoc(collection(db, "orders"), {
      table: state.tableNumber,
      guests: state.guests,
      items: state.tableDishes,
      status: "preparing", 
      timestamp: serverTimestamp() 
    });
    
    currentOrderId = docRef.id;
    state.orderPlaced = true;
    
    listenToOrderUpdates(currentOrderId);
    updatePanelContent();
  } catch (e) {
    console.error("Firebase Error:", e);
    alert("Error: " + e.message);
    btnPlaceOrder.disabled = false;
    btnPlaceOrder.innerText = "Place Order";
  }
};

// ===== SETUP & UI FUNCTIONS =====
continueBtn.addEventListener('click', () => {
  const tableNumber = tableSelect.value;
  const guests = guestSelect.value;
  if (!tableNumber || !guests) return alert('Select table and guests');

  state.tableNumber = tableNumber;
  state.guests = parseInt(guests);
  displayTable.textContent = tableNumber;
  displayGuests.textContent = guests;
  panelTableNum.textContent = tableNumber;
  panelGuestNum.textContent = guests;

  setupScreen.classList.add('hidden');
  mainApp.classList.add('active');
  setupTable();
  renderMenu();
});

function setupTable() {
  const guests = state.guests;
  diningTable.className = guests <= 4 ? 'dining-table round' : 'dining-table rectangular';
  chairsContainer.className = guests <= 4 ? 'chairs-container chairs-round' : 'chairs-container chairs-rect';
  chairsContainer.innerHTML = '';
  for (let i = 0; i < guests; i++) {
    const chair = document.createElement('div');
    chair.className = 'chair';
    chair.innerHTML = `<div class="chair-back"></div><div class="chair-seat"><div class="chair-cushion"></div></div>`;
    chairsContainer.appendChild(chair);
  }
}

function renderMenu() {
  menuGrid.innerHTML = '';
  menuData.forEach(dish => {
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.id = dish.id;
    card.innerHTML = `
      <div class="dish-image"><img src="${dish.image}"></div>
      <div class="dish-content">
        <h3>${dish.name}</h3><p>${dish.desc}</p>
        <div class="dish-footer">
          <span>₹${dish.price}</span>
          <button class="btn-add" onclick="window.addToTable(${dish.id})">Add</button>
          <div class="qty-controls"><button class="qty-btn" onclick="window.updateQty(${dish.id}, -1)">−</button><span class="qty-display">0</span><button class="qty-btn" onclick="window.updateQty(${dish.id}, 1)">+</button></div>
        </div>
      </div>`;
    menuGrid.appendChild(card);
  });
}

// ===== LOGIC FUNCTIONS =====
function addToTable(dishId) {
  if (state.orderPlaced) return;
  state.tableDishes[dishId] = 1;
  updateDishUI(dishId);
}

function updateQty(dishId, delta) {
  if (state.orderPlaced) return;
  const newQty = (state.tableDishes[dishId] || 0) + delta;
  if (newQty <= 0) delete state.tableDishes[dishId];
  else state.tableDishes[dishId] = newQty;
  updateDishUI(dishId);
}

function updateDishUI(dishId) {
  const card = document.querySelector(`.dish-card[data-id="${dishId}"]`);
  const qty = state.tableDishes[dishId] || 0;
  if (card) {
    card.querySelector('.btn-add').classList.toggle('hidden', qty > 0);
    card.querySelector('.qty-controls').classList.toggle('active', qty > 0);
    card.querySelector('.qty-display').textContent = qty;
  }
  updateTableVisualization();
  updateSummary();
}

function updateTableVisualization() {
  tableDishesContainer.innerHTML = '';
  Object.entries(state.tableDishes).forEach(([id, qty]) => {
    const dish = menuData.find(d => d.id == id);
    tableDishesContainer.innerHTML += `<div class="table-dish-item"><img src="${dish.image}"><span class="qty">${qty}</span></div>`;
  });
}

function updateSummary() {
  let items = 0, price = 0;
  Object.entries(state.tableDishes).forEach(([id, qty]) => {
    const dish = menuData.find(d => d.id == id);
    items += qty; price += dish.price * qty;
  });
  totalItems.textContent = items;
  totalPrice.textContent = price.toLocaleString();
  floatingSummary.classList.toggle('visible', items > 0);
}

// ===== PANEL UI =====
btnViewTable.onclick = () => {
  panelOverlay.classList.add('visible');
  orderPanel.classList.add('visible');
  updatePanelContent();
};

btnClosePanel.onclick = () => {
  panelOverlay.classList.remove('visible');
  orderPanel.classList.remove('visible');
};

function updatePanelContent() {
  if (state.orderPlaced) {
    orderReviewView.style.display = 'none';
    orderStatusView.style.display = 'block';
    btnPlaceOrder.style.display = 'none';
    statusItemsList.innerHTML = '';
    Object.entries(state.tableDishes).forEach(([id, qty]) => {
      const dish = menuData.find(d => d.id == id);
      statusItemsList.innerHTML += `<div class="order-item locked"><div class="order-item-name">${dish.name}</div><div>Qty: ${qty}</div></div>`;
    });
  } else {
    orderReviewView.style.display = 'block';
    orderStatusView.style.display = 'none';
    renderOrderItems();
  }
}

function renderOrderItems() {
  orderItemsList.innerHTML = '';
  const dishes = Object.entries(state.tableDishes);
  panelEmpty.style.display = dishes.length ? 'none' : 'block';
  orderSummary.style.display = dishes.length ? 'block' : 'none';
  
  dishes.forEach(([id, qty]) => {
    const dish = menuData.find(d => d.id == id);
    orderItemsList.innerHTML += `
      <div class="order-item">
        <div class="order-item-info"><div>${dish.name}</div><div>₹${dish.price} × ${qty}</div></div>
        <div class="order-item-controls">
          <button class="qty-btn" onclick="window.updateQtyFromPanel(${id}, -1)">−</button>
          <span class="qty-display">${qty}</span>
          <button class="qty-btn" onclick="window.updateQtyFromPanel(${id}, 1)">+</button>
        </div>
      </div>`;
  });
  updatePanelSummary();
}

function updatePanelSummary() {
  let subtotal = 0;
  Object.entries(state.tableDishes).forEach(([id, qty]) => {
    subtotal += menuData.find(d => d.id == id).price * qty;
  });
  document.getElementById('panelSubtotal').textContent = subtotal.toLocaleString();
  document.getElementById('panelTotal').textContent = (subtotal * 1.05).toLocaleString();
}

// ===== GLOBAL EXPORTS =====
window.addToTable = addToTable;
window.updateQty = updateQty;
window.updateQtyFromPanel = (id, delta) => { updateQty(id, delta); updatePanelContent(); };