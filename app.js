// ===== IMPORT FIREBASE =====
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  // ===== APP STATE =====
    const state = {
      tableNumber: null,
      guests: null,
      dishes: [],
      tableDishes: {}, // { dishId: quantity }
      orderPlaced: false,
      orderStatus: 0 // 0: placed, 1: kitchen, 2: preparing, 3: ready, 4: served
    };

    const ORDER_STEPS = ['placed', 'kitchen', 'preparing', 'ready', 'served'];


    const menuData = [
      // Starters
      { id: 1, name: "Royal Spring Rolls", desc: "Crispy golden rolls with exotic vegetables and royal spices", price: 320, category: "starters", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 2, name: "Tandoori Chicken Tikka", desc: "Succulent chicken marinated in royal spices, chargrilled to perfection", price: 450, category: "starters", diet: "nonveg", image: "/placeholder.svg?height=200&width=300" },
      { id: 3, name: "Paneer Pakora Royale", desc: "Cottage cheese fritters with saffron-infused batter", price: 280, category: "starters", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 4, name: "Fish Amritsari", desc: "Fresh river fish in gram flour coating with mint chutney", price: 520, category: "starters", diet: "nonveg", image: "/placeholder.svg?height=200&width=300" },
      
      // Main Course
      { id: 5, name: "Butter Chicken Imperial", desc: "Tender chicken in rich tomato-cream sauce with kasuri methi", price: 580, category: "main", diet: "nonveg", image: "/placeholder.svg?height=200&width=300" },
      { id: 6, name: "Dal Makhani Maharaja", desc: "Black lentils slow-cooked overnight with cream and butter", price: 380, category: "main", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 7, name: "Palak Paneer Crown", desc: "Cottage cheese cubes in velvety spinach gravy with cream", price: 420, category: "main", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 8, name: "Mutton Biryani Nawabi", desc: "Fragrant basmati rice layered with tender mutton and saffron", price: 680, category: "main", diet: "nonveg", image: "/placeholder.svg?height=200&width=300" },
      { id: 9, name: "Vegetable Fried Rice", desc: "Wok-tossed rice with garden fresh vegetables", price: 320, category: "main", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 10, name: "Lamb Rogan Josh", desc: "Kashmiri style lamb curry with aromatic spices", price: 620, category: "main", diet: "nonveg", image: "/placeholder.svg?height=200&width=300" },
      
      // Beverages
      { id: 11, name: "Royal Mango Lassi", desc: "Creamy yogurt drink with Alphonso mangoes and cardamom", price: 180, category: "drinks", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 12, name: "Masala Chai", desc: "Traditional spiced tea with ginger and aromatic spices", price: 80, category: "drinks", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 13, name: "Fresh Lime Soda", desc: "Refreshing lime with soda, mint and black salt", price: 120, category: "drinks", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 14, name: "Rose Sherbet", desc: "Chilled rose-flavored drink with basil seeds", price: 150, category: "drinks", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      
      // Desserts
      { id: 15, name: "Gulab Jamun", desc: "Soft milk dumplings soaked in rose-cardamom syrup", price: 180, category: "desserts", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 16, name: "Rasmalai Royale", desc: "Soft cottage cheese patties in saffron milk", price: 220, category: "desserts", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 17, name: "Kulfi Falooda", desc: "Traditional Indian ice cream with vermicelli and rose syrup", price: 250, category: "desserts", diet: "veg", image: "/placeholder.svg?height=200&width=300" },
      { id: 18, name: "Kheer Maharani", desc: "Creamy rice pudding with nuts, saffron and cardamom", price: 200, category: "desserts", diet: "veg", image: "/placeholder.svg?height=200&width=300" }
    ];


    // ===== MENU DATA =====
    function renderMenu() {
  console.log("renderMenu called");
  console.log("menuGrid =", menuGrid);
  console.log("menuData length =", menuData.length);

  menuGrid.innerHTML = '';

      menuData.forEach(dish => {
        const card = document.createElement('div');
        card.className = 'dish-card';
        card.dataset.id = dish.id;
        card.dataset.category = dish.category;
        card.dataset.diet = dish.diet;

        card.innerHTML = `
          <div class="dish-image">
            <img src="${dish.image}" alt="${dish.name}">
            <div class="diet-badge ${dish.diet}">
              ${dish.diet === 'veg' 
                ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>' 
                : '<svg viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22"/></svg>'}
            </div>
          </div>
          <div class="dish-content">
            <h3 class="dish-name">${dish.name}</h3>
            <p class="dish-desc">${dish.desc}</p>
            <div class="dish-footer">
              <span class="dish-price">₹${dish.price}</span>
              <button class="btn-add" onclick="addToTable(${dish.id})" ${state.orderPlaced ? 'disabled' : ''}>Add to Table</button>
              <div class="qty-controls">
                <button class="qty-btn" onclick="updateQty(${dish.id}, -1)" ${state.orderPlaced ? 'disabled' : ''}>−</button>
                <span class="qty-display">0</span>
                <button class="qty-btn" onclick="updateQty(${dish.id}, 1)" ${state.orderPlaced ? 'disabled' : ''}>+</button>
              </div>
            </div>
          </div>
        `;

        menuGrid.appendChild(card);
      });
}

    // ===== BUILD ORDER PAYLOAD (FIREBASE) =====
  function buildOrderPayload() {
  let items = [];
  let subtotal = 0;

  Object.entries(state.tableDishes).forEach(([dishId, qty]) => {
    const dish = menuData.find(d => d.id === parseInt(dishId));
    if (!dish) return;

    items.push({
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
      qty: qty
    });

    subtotal += dish.price * qty;
  });

  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  return {
    tableNumber: state.tableNumber,
    guests: state.guests,
    items,
    subtotal,
    tax,
    total,
    orderStatus: "placed",
    createdAt: serverTimestamp()
  };
}


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
    const tableDishes = document.getElementById('tableDishes');
    const mobileTableScroll = document.getElementById('mobileTableScroll');
    const menuGrid = document.getElementById('menuGrid');
    const categoryTabs = document.getElementById('categoryTabs');
    const searchInput = document.getElementById('searchInput');
    const vegFilter = document.getElementById('vegFilter');
    const nonvegFilter = document.getElementById('nonvegFilter');
    const floatingSummary = document.getElementById('floatingSummary');
    const totalItems = document.getElementById('totalItems');
    const totalPrice = document.getElementById('totalPrice');

    // Panel Elements
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
    const panelFooter = document.getElementById('panelFooter');
    const btnAddMore = document.getElementById('btnAddMore');
    const btnPlaceOrder = document.getElementById('btnPlaceOrder');
    const panelTableNum = document.getElementById('panelTableNum');
    const panelGuestNum = document.getElementById('panelGuestNum');

    // ===== SETUP FUNCTIONS =====
    continueBtn.addEventListener('click', () => {
      const tableNumber = tableSelect.value;
      const guests = guestSelect.value;

      if (!tableNumber || !guests) {
        alert('Please select both table number and number of guests');
        return;
      }

      state.tableNumber = tableNumber;
      state.guests = parseInt(guests);

       // ===== Save table & guest info to Firestore =====
      setupScreen.classList.add('hidden');
      mainApp.classList.add('active');

      // ===== Show Main App UI =====

      setupScreen.classList.add('hidden');
      mainApp.classList.add('active');


      setupTable();
      renderMenu();
      console.log('Dining experience started at Table', tableNumber, 'for', guests, 'guests');
    });

    // ===== TABLE SETUP =====
    function setupTable() {
      const guests = state.guests;

      // Set table shape
      if (guests <= 4) {
        diningTable.classList.remove('rectangular');
        diningTable.classList.add('round');
        chairsContainer.classList.remove('chairs-rect');
        chairsContainer.classList.add('chairs-round');
      } else {
        diningTable.classList.remove('round');
        diningTable.classList.add('rectangular');
        chairsContainer.classList.remove('chairs-round');
        chairsContainer.classList.add('chairs-rect');
      }

      // Generate chairs
      chairsContainer.innerHTML = '';
      for (let i = 0; i < guests; i++) {
        const chair = document.createElement('div');
        chair.className = 'chair';
        chair.innerHTML = `
          <div class="chair-back"></div>
          <div class="chair-seat">
            <div class="chair-cushion"></div>
          </div>
        `;
        chairsContainer.appendChild(chair);
      }
    }

    // ===== MENU RENDERING =====
    /*function renderMenu() {
      menuGrid.innerHTML = '';

      menuData.forEach(dish => {
        const card = document.createElement('div');
        card.className = 'dish-card';
        card.dataset.id = dish.id;
        card.dataset.category = dish.category;
        card.dataset.diet = dish.diet;

        card.innerHTML = `
          <div class="dish-image">
            <img src="${dish.image}" alt="${dish.name}">
            <div class="diet-badge ${dish.diet}">
              ${dish.diet === 'veg' 
                ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>' 
                : '<svg viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22"/></svg>'}
            </div>
          </div>
          <div class="dish-content">
            <h3 class="dish-name">${dish.name}</h3>
            <p class="dish-desc">${dish.desc}</p>
            <div class="dish-footer">
              <span class="dish-price">₹${dish.price}</span>
              <button class="btn-add" onclick="addToTable(${dish.id})" ${state.orderPlaced ? 'disabled' : ''}>Add to Table</button>
              <div class="qty-controls">
                <button class="qty-btn" onclick="updateQty(${dish.id}, -1)" ${state.orderPlaced ? 'disabled' : ''}>−</button>
                <span class="qty-display">0</span>
                <button class="qty-btn" onclick="updateQty(${dish.id}, 1)" ${state.orderPlaced ? 'disabled' : ''}>+</button>
              </div>
            </div>
          </div>
        `;

        menuGrid.appendChild(card);
      });
    }*/

    // ===== ADD TO TABLE =====
    function addToTable(dishId) {
      if (state.orderPlaced) return;
      state.tableDishes[dishId] = 1;
      updateDishCard(dishId);
      updateTableVisualization();
      updateSummary();
    }

    function updateQty(dishId, delta) {
      if (state.orderPlaced) return;
      
      const currentQty = state.tableDishes[dishId] || 0;
      const newQty = currentQty + delta;

      if (newQty <= 0) {
        delete state.tableDishes[dishId];
      } else {
        state.tableDishes[dishId] = newQty;
      }

      updateDishCard(dishId);
      updateTableVisualization();
      updateSummary();
    }

    function updateDishCard(dishId) {
      const card = document.querySelector(`.dish-card[data-id="${dishId}"]`);
      if (!card) return;

      const qty = state.tableDishes[dishId] || 0;
      const addBtn = card.querySelector('.btn-add');
      const qtyControls = card.querySelector('.qty-controls');
      const qtyDisplay = card.querySelector('.qty-display');

      if (qty > 0) {
        addBtn.classList.add('hidden');
        qtyControls.classList.add('active');
        qtyDisplay.textContent = qty;
      } else {
        addBtn.classList.remove('hidden');
        qtyControls.classList.remove('active');
      }
    }

    // ===== TABLE VISUALIZATION =====
    function updateTableVisualization() {
      // Desktop table
      tableDishes.innerHTML = '';
      
      Object.entries(state.tableDishes).forEach(([dishId, qty]) => {
        const dish = menuData.find(d => d.id === parseInt(dishId));
        if (!dish) return;

        const dishEl = document.createElement('div');
        dishEl.className = 'table-dish-item';
        dishEl.innerHTML = `
          <img src="${dish.image}" alt="${dish.name}">
          <span class="qty">${qty}</span>
        `;
        tableDishes.appendChild(dishEl);
      });

      // Mobile table
      const dishes = Object.entries(state.tableDishes);
      if (dishes.length === 0) {
        mobileTableScroll.innerHTML = '<div class="mobile-empty">Your table awaits your selections</div>';
      } else {
        mobileTableScroll.innerHTML = '';
        dishes.forEach(([dishId, qty]) => {
          const dish = menuData.find(d => d.id === parseInt(dishId));
          if (!dish) return;

          const chip = document.createElement('div');
          chip.className = 'mobile-dish-chip';
          chip.innerHTML = `
            <img src="${dish.image}" alt="${dish.name}">
            <div class="info">
              <span class="name">${dish.name}</span>
              <span class="qty">Qty: ${qty}</span>
            </div>
          `;
          mobileTableScroll.appendChild(chip);
        });
      }
    }

    // ===== SUMMARY =====
    function updateSummary() {
      let items = 0;
      let price = 0;

      Object.entries(state.tableDishes).forEach(([dishId, qty]) => {
        const dish = menuData.find(d => d.id === parseInt(dishId));
        if (dish) {
          items += qty;
          price += dish.price * qty;
        }
      });

      totalItems.textContent = items;
      totalPrice.textContent = price.toLocaleString();

      if (items > 0) {
        floatingSummary.classList.add('visible');
      } else {
        floatingSummary.classList.remove('visible');
      }
    }

    // ===== FILTERING =====
    function filterMenu() {
      const searchTerm = searchInput.value.toLowerCase();
      const showVeg = vegFilter.checked;
      const showNonveg = nonvegFilter.checked;
      const activeCategory = document.querySelector('.category-tab.active').dataset.category;

      document.querySelectorAll('.dish-card').forEach(card => {
        const dish = menuData.find(d => d.id === parseInt(card.dataset.id));
        if (!dish) return;

        let show = true;

        // Category filter
        if (activeCategory !== 'all' && dish.category !== activeCategory) {
          show = false;
        }

        // Diet filter
        if (dish.diet === 'veg' && !showVeg) show = false;
        if (dish.diet === 'nonveg' && !showNonveg) show = false;

        // Search filter
        if (searchTerm && !dish.name.toLowerCase().includes(searchTerm) && !dish.desc.toLowerCase().includes(searchTerm)) {
          show = false;
        }

        card.classList.toggle('hidden', !show);
      });
    }

    // Category tabs
    categoryTabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('category-tab')) {
        document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        filterMenu();
      }
    });

    // Search input
    searchInput.addEventListener('input', filterMenu);

    // Diet filters
    vegFilter.addEventListener('change', filterMenu);
    nonvegFilter.addEventListener('change', filterMenu);

    // ===== ORDER PANEL =====
    function openPanel() {
      panelOverlay.classList.add('visible');
      orderPanel.classList.add('visible');
      document.body.style.overflow = 'hidden';
      updatePanelContent();
    }

    function closePanel() {
      panelOverlay.classList.remove('visible');
      orderPanel.classList.remove('visible');
      document.body.style.overflow = '';
    }

    btnViewTable.addEventListener('click', openPanel);
    btnClosePanel.addEventListener('click', closePanel);
    panelOverlay.addEventListener('click', closePanel);

    btnAddMore.addEventListener('click', () => {
      closePanel();
      document.querySelector('.menu-section').scrollIntoView({ behavior: 'smooth' });
    });

    function updatePanelContent() {
      const dishes = Object.entries(state.tableDishes);
      const hasItems = dishes.length > 0;

      if (state.orderPlaced) {
        // Show order status view
        orderReviewView.classList.add('hidden');
        orderStatusView.classList.add('visible');
        btnAddMore.style.display = 'none';
        btnPlaceOrder.style.display = 'none';
        
        updateStatusItems();
        updateStepperProgress();
      } else {
        // Show order review view
        orderReviewView.classList.remove('hidden');
        orderStatusView.classList.remove('visible');
        btnAddMore.style.display = 'block';
        btnPlaceOrder.style.display = 'block';

        if (hasItems) {
          panelEmpty.style.display = 'none';
          orderSummary.style.display = 'block';
          renderOrderItems();
          updatePanelSummary();
          btnPlaceOrder.disabled = false;
        } else {
          panelEmpty.style.display = 'block';
          orderSummary.style.display = 'none';
          orderItemsList.innerHTML = '';
          btnPlaceOrder.disabled = true;
        }
      }
    }

    function renderOrderItems() {
      orderItemsList.innerHTML = '';
      
      Object.entries(state.tableDishes).forEach(([dishId, qty]) => {
        const dish = menuData.find(d => d.id === parseInt(dishId));
        if (!dish) return;

        const itemEl = document.createElement('div');
        itemEl.className = 'order-item';
        itemEl.innerHTML = `
          <img src="${dish.image}" alt="${dish.name}">
          <div class="order-item-info">
            <div class="order-item-name">${dish.name}</div>
            <div class="order-item-price">₹${dish.price} × ${qty} = ₹${dish.price * qty}</div>
          </div>
          <div class="order-item-controls">
            <button class="qty-btn" onclick="updateQtyFromPanel(${dish.id}, -1)">−</button>
            <span class="qty-display">${qty}</span>
            <button class="qty-btn" onclick="updateQtyFromPanel(${dish.id}, 1)">+</button>
          </div>
          <button class="btn-remove-item" onclick="removeFromOrder(${dish.id})">×</button>
        `;
        orderItemsList.appendChild(itemEl);
      });
    }

    function updateStatusItems() {
      statusItemsList.innerHTML = '';
      
      Object.entries(state.tableDishes).forEach(([dishId, qty]) => {
        const dish = menuData.find(d => d.id === parseInt(dishId));
        if (!dish) return;

        // Simulate individual dish status based on overall order status
        let dishStatus = '';
        let statusClass = '';
        if (state.orderStatus >= 4) {
          dishStatus = 'Served';
          statusClass = 'served';
        } else if (state.orderStatus >= 3) {
          dishStatus = 'Ready';
          statusClass = 'ready';
        } else if (state.orderStatus >= 2) {
          dishStatus = 'Preparing';
          statusClass = 'preparing';
        }

        const itemEl = document.createElement('div');
        itemEl.className = 'order-item locked';
        itemEl.innerHTML = `
          <img src="${dish.image}" alt="${dish.name}">
          <div class="order-item-info">
            <div class="order-item-name">${dish.name}</div>
            <div class="order-item-price">₹${dish.price} × ${qty} = ₹${dish.price * qty}</div>
            ${dishStatus ? `<span class="order-item-status ${statusClass}">${dishStatus}</span>` : ''}
          </div>
        `;
        statusItemsList.appendChild(itemEl);
      });
    }

    function updateStepperProgress() {
      const steps = document.querySelectorAll('.stepper-step');
      steps.forEach((step, index) => {
        step.classList.remove('completed', 'active');
        if (index < state.orderStatus) {
          step.classList.add('completed');
        } else if (index === state.orderStatus) {
          step.classList.add('active');
        }
      });
    }

    function updateQtyFromPanel(dishId, delta) {
      updateQty(dishId, delta);
      updatePanelContent();
    }

    function removeFromOrder(dishId) {
      delete state.tableDishes[dishId];
      updateDishCard(dishId);
      updateTableVisualization();
      updateSummary();
      updatePanelContent();
    }

    function updatePanelSummary() {
      let subtotal = 0;

      Object.entries(state.tableDishes).forEach(([dishId, qty]) => {
        const dish = menuData.find(d => d.id === parseInt(dishId));
        if (dish) {
          subtotal += dish.price * qty;
        }
      });

      const tax = Math.round(subtotal * 0.05); // 5% tax
      const total = subtotal + tax;

      document.getElementById('panelSubtotal').textContent = subtotal.toLocaleString();
      document.getElementById('panelTax').textContent = tax.toLocaleString();
      document.getElementById('panelTotal').textContent = total.toLocaleString();
    }

    // ===== PLACE ORDER =====
    // ===== SIMULATE ORDER PROGRESS =====


function simulateOrderProgress() {
  const statusTimes = [3000, 5000, 8000, 4000]; // ms for each step
  let currentStep = 0;

  function advanceStatus() {
    if (currentStep < statusTimes.length) {
      setTimeout(async () => {
        state.orderStatus++;
        updatePanelContent();

        // Update Firestore order status
        if (currentOrderId) {
          try {
            const orderRef = doc(db, "orders", currentOrderId);
            await updateDoc(orderRef, {
              orderStatus: ORDER_STEPS[state.orderStatus]
            });
          } catch (error) {
            console.error("Error updating order status:", error);
          }
        }

        currentStep++;
        advanceStatus(); // call next step
      }, statusTimes[currentStep]);
    }
  }

  advanceStatus();
}


    let currentOrderId = null; // add this at the top of app.js
    
    btnPlaceOrder.addEventListener('click', async () => {
  if (Object.keys(state.tableDishes).length === 0) return;

  state.orderPlaced = true;
  state.orderStatus = 0;

  // Disable all menu buttons
  document.querySelectorAll('.btn-add, .qty-btn').forEach(btn => {
    btn.disabled = true;
  });

  updatePanelContent();

  // ===== Save order to Firestore =====
  try {
    const orderPayload = buildOrderPayload();
    const docRef = await addDoc(collection(db, "orders"), orderPayload);
    currentOrderId = docRef.id; // store the order ID
    console.log("Order saved with ID:", docRef.id);
    // Start simulated progress
    simulateOrderProgress(); // No need to pass orderId if you use currentOrderId
  } catch (error) {
    console.error("Error saving order:", error);
  }
  simulateOrderProgress(); // start progress
});



    // Scroll to table (updated)
    function scrollToTable() {
      const tableSection = document.getElementById('tableSection');
      const mobileView = document.getElementById('mobileTableView');
      
      if (window.innerWidth <= 768) {
        mobileView.scrollIntoView({ behavior: 'smooth' });
      } else {
        tableSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
    window.addToTable = addToTable;
    window.updateQty= updateQty;
    window.updateQtyFromPanel = updateQtyFromPanel;
    window.removeFromOrder = removeFromOrder;
    currentOrderId