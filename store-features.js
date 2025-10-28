// =======================
// FDK Store Features JS
// =======================

// Simulated Gmail Login (for demo purposes)
let currentUser = null;

// Dummy login function (replace with real OAuth in production)
function loginWithGmail(email) {
  currentUser = email;
  alert(`Logged in as ${currentUser}`);
}

// Example Product Data
const products = [
  {
    id: 1,
    title: "Men's Stainless Watch",
    description: "Stainless steel • Quartz • Water-resistant",
    features: ["Stainless Steel", "Quartz Movement", "Water Resistant 50m"],
    price: 89.99,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80"]
  },
  {
    id: 2,
    title: "Wireless Headphones",
    description: "Noise cancellation • 30h battery • Premium bass",
    features: ["Noise Cancellation", "Long Battery", "Premium Bass"],
    price: 59.99,
    images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&q=80"]
  },
  {
    id: 3,
    title: "Smart Sneakers",
    description: "Responsive sole • Modern silhouette",
    features: ["Responsive Sole", "Modern Look"],
    price: 120.00,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80"]
  }
];

// Cart System
let cart = [];

// Review System (linked with email to prevent duplicate)
let reviews = {}; // { productId: {userEmail: {rating, comment}} }

// Populate Product Cards dynamically
function populateProducts() {
  const container = document.querySelector("#products .flex.flex-wrap");
  container.innerHTML = "";

  products.forEach(product => {
    const div = document.createElement("div");
    div.className = "p-4 md:w-1/3 lg:w-1/4 w-full";

    div.innerHTML = `
      <div class="h-full glass rounded-2xl p-4 hover:-translate-y-3 transform transition-shadow duration-300 neon-yellow border border-white/6 shadow-lg">
        <img src="${product.images[0]}" alt="${product.title}" class="w-full h-48 object-cover rounded-xl mb-2">
        <h3 class="text-lg font-semibold text-pink-300">${product.title}</h3>
        <p class="text-sm text-gray-300 mt-1">${product.description}</p>
        <div class="mt-4 flex items-center justify-between">
          <span class="text-lg font-bold">$${product.price}</span>
          <button class="bg-pink-400 text-black px-3 py-1 rounded-full font-semibold hover:scale-105 transition" onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
        <div class="mt-2">
          <button class="bg-yellow-400 px-3 py-1 rounded-full font-semibold text-black hover:scale-105 transition" onclick="openReviewForm(${product.id})">Review ⭐</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// Add to Cart
function addToCart(productId) {
  if (!currentUser) {
    alert("Please login with Gmail to buy products.");
    return;
  }

  const prod = products.find(p => p.id === productId);
  cart.push({ ...prod, user: currentUser });
  alert(`${prod.title} added to cart!`);
  console.log("Cart:", cart);
}

// Review Form
function openReviewForm(productId) {
  if (!currentUser) {
    alert("Please login with Gmail to leave a review.");
    return;
  }

  const rating = prompt("Enter rating (1-5 stars):");
  const comment = prompt("Write your review:");

  if (!reviews[productId]) reviews[productId] = {};
  if (reviews[productId][currentUser]) {
    alert("You already reviewed this product.");
    return;
  }

  reviews[productId][currentUser] = { rating, comment };
  alert("Review submitted!");
  console.log("Reviews:", reviews);
}

// Simple Gmail Login Button for Demo
const loginBtn = document.createElement("button");
loginBtn.textContent = "Login with Gmail";
loginBtn.className = "fixed top-6 right-6 bg-blue-500 text-white px-4 py-2 rounded-full z-50";
loginBtn.onclick = () => {
  const email = prompt("Enter your Gmail:");
  if (email && email.includes("@gmail.com")) loginWithGmail(email);
  else alert("Invalid Gmail address.");
};
document.body.appendChild(loginBtn);

// Initialize
populateProducts();
