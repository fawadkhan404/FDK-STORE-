// Example: Get product data dynamically (future: fetch from JSON)
const products = {
  product1: {
    title: "Men's Stainless Watch",
    description: "High-quality stainless steel watch with quartz movement and water resistance.",
    features: ["Stainless Steel", "Quartz", "Water Resistant"],
    price: "$89.99",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80"
    ],
    reviews: [
      {user: "Ali", rating: 5, comment: "Excellent quality!"},
      {user: "Sara", rating: 4, comment: "Good watch, fast delivery."}
    ]
  }
};

// Load product (for now hardcoded product1)
const product = products["product1"];
document.getElementById("productTitle").textContent = product.title;
document.getElementById("productDescription").textContent = product.description;
document.getElementById("productPrice").textContent = product.price;

// Features
const featuresEl = document.getElementById("productFeatures");
product.features.forEach(f => {
  const li = document.createElement("li");
  li.textContent = f;
  featuresEl.appendChild(li);
});

// Images
const mainImage = document.getElementById("mainImage");
mainImage.src = product.images[0];

// Reviews
const reviewsContainer = document.getElementById("reviewsContainer");
function renderReviews() {
  reviewsContainer.innerHTML = "";
  product.reviews.forEach(r => {
    const div = document.createElement("div");
    div.className = "bg-gray-800 p-3 rounded";
    div.innerHTML = `<strong>${r.user}</strong> - ⭐${r.rating}<p>${r.comment}</p>`;
    reviewsContainer.appendChild(div);
  });
}
renderReviews();

// Add new review
document.getElementById("reviewForm").addEventListener("submit", e => {
  e.preventDefault();
  const newReview = {
    user: document.getElementById("reviewName").value,
    rating: document.getElementById("reviewRating").value,
    comment: document.getElementById("reviewComment").value
  };
  product.reviews.push(newReview);
  renderReviews();
  e.target.reset();
});
